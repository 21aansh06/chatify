import React, { useState } from 'react'
import loginStore from '../../store/loginStore'
import countries from "../../utils/Countries"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import userStore from '../../store/userStore'
import { useForm } from 'react-hook-form'
import avatars from '../../utils/avatars'
import themeStore from '../../store/themeStore'
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"
import { FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaEnvelope } from "react-icons/fa6"
import Spinner from '../../utils/Spinner'
import { sendOtp, updateUserProfile, verifyOtp } from '../../services/user'
import { toast } from 'react-toastify'
import { LuMessageCircleCode } from "react-icons/lu";

const loginValidationSchema = yup
  .object()
  .shape({
    phoneNumber: yup.string().nullable().notRequired().matches(/^\d+$/, "Phone number must contain only digits").transform(((value, originalValue) =>
      originalValue.trim() === "" ? null : value
    )),
    email: yup.string().nullable().notRequired().email("Please enter vaid email").transform((value, originalValue) =>
      originalValue.trim() === "" ? null : value
    )
  }).test(
    "at-least-one",
    "Either email or phoneNumber is required",
    function (value) {
      return !!(value.phoneNumber || value.email)
    }
  )

const otpValidationSchema = yup
  .object()
  .shape({
    otp: yup.string().length(6, "Otp must be exactly 6 digits").required("Otp is required")
  })
const profileValidationSchema = yup
  .object()
  .shape({
    username: yup.string().required("Username is required"),
    agreed: yup.bool().oneOf([true], "You must agree to terms")
  })

const Login = () => {
  const { step, userPhoneData, setStep, setUserPhoneData, resetLoginState } = loginStore()
  const { setUser } = userStore()
  const { theme, setTheme } = themeStore()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [country, setCountry] = useState(countries[0])
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [email, setEmail] = useState("")
  const [profilePic, setProfilePic] = useState(null)
  const [avatar, setAvatar] = useState(avatars[0])
  const [profilePicFile, setProfilePicFile] = useState(null)
  const [error, setError] = useState("")
  const [dropDown, setDropDown] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors }
  } = useForm({
    resolver: yupResolver(loginValidationSchema)
  })
  const {
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
    setValue: setOtpValue
  } = useForm({
    resolver: yupResolver(otpValidationSchema)
  })
  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    watch
  } = useForm({
    resolver: yupResolver(profileValidationSchema)
  })
  const onLoginSubmit = async (data) => {
    try {
      setLoading(true)

      const { email, phoneNumber } = data

      if (email) {
        const response = await sendOtp(null, null, email)

        if (response?.success) {
          toast.success(response.message)
          setUserPhoneData({ email })
          setStep(2)
        } else {
          toast.error(response?.message)
        }
      } else {
        const response = await sendOtp(phoneNumber, country.dialCode)

        if (response?.success) {
          toast.success(response.message)
          setUserPhoneData({ phoneNumber, phoneSuffix: country.dialCode })
          setStep(2)
        } else {
          toast.error(response?.message)
        }
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const onOtpSubmit = async () => {
    try {
      setLoading(true);

      if (!userPhoneData) {
        throw new Error("Phone number missing");
      }

      const otpStr = otp.join("");
      let response;

      if (userPhoneData?.email) {
        response = await verifyOtp(null, null, otpStr, userPhoneData.email);
      } else {
        response = await verifyOtp(userPhoneData.phoneNumber, userPhoneData.phoneSuffix, otpStr);
      }

      if (response.success) {
        toast.success(response.message);
        const token = response?.token
        localStorage.setItem("auth_token", token)
        const user = response.data?.user;

        if (user?.username && user?.profilePic) {
          setUser(true);
          toast.success("Welcome");
          navigate("/");
          resetLoginState();
        } else {
          setStep(3);
        }
      }
    } catch (error) {
      toast.error(error.message);
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePic(URL.createObjectURL(file))
      setProfilePicFile(file)
      setError("")
    }
  }

  const onProfileSubmit = async (data) => {
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("username", data.username)
      formData.append("agreed", data.agreed)
      if (profilePicFile) {
        formData.append("media", profilePicFile)
      } else {
        formData.append("media", avatar)
      }
      const response = await updateUserProfile(formData)
      if (response.success) {

        toast.success("Welcome")
        navigate("/")
        resetLoginState()
      } else {
        toast.error("Something went wrong")
      }
    } catch (error) {
      toast.error(error.message)
      setError(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const filterCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(search.toLowerCase()) ||
      country.dialCode.includes(search)
  )


  const PrograssBar = () => (
    <div className={`w-full ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"} rounded-full h-2.5 mb-6`}>
      <div className={`${theme === "dark" ? "bg-indigo-400" : "bg-indigo-600"} h-2.5 rounded-full transition-all duration-500 ease-in-out`} style={{ width: `${(step / 3) * 100}%` }}>
      </div>
    </div>
  )
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpValue("otp", newOtp.join(""))
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus()
    }
  };

  const handleBack = () => {
    setStep(1)
    setUserPhoneData(null)
    setOtp(["", "", "", "", "", ""])
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500 ${theme === "dark" ? "bg-[#020617]" : "bg-zinc-100"
      }`}>

      <div className="absolute inset-0 z-0">
        <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] mix-blend-screen opacity-70 animate-pulse ${theme === "dark" ? "bg-indigo-600" : "bg-indigo-400"
          }`} />

        <div className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[120px] mix-blend-screen opacity-60 ${theme === "dark" ? "bg-blue-600" : "bg-blue-300"
          }`} />


        <div className={`absolute top-1/2 left-[-10%] -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] opacity-40 ${theme === "dark" ? "bg-purple-800" : "bg-purple-200"
          }`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative z-10 w-full max-w-md backdrop-blur-[40px] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border-2 p-10 ${theme === "dark"
            ? "bg-black/30 border-white/10 text-white"
            : "bg-white/40 border-white/60 text-zinc-900"
          }`}
      >
       
        <div className="flex flex-col items-center mb-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl mb-6 ${theme === "dark" ? "bg-indigo-400 text-zinc-950" : "bg-indigo-600 text-white"}`}>
            <LuMessageCircleCode className="w-10 h-10 " />
          </div>
          <h1 className={`text-4xl font-black italic tracking-tighter ${theme === "dark" ? "text-indigo-400" : "text-indigo-600"}`}>
            CHATIFY
          </h1>
        </div>

        <PrograssBar />
        {error && <p className='text-red-500 text-center mb-4 text-sm font-bold'>{error}</p>}

        {/* step-1 */}
        {step === 1 && (
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className='space-y-6'>
            <div className='space-y-4'>
              <div className='group space-y-2'>
                <label className={`text-xs font-bold uppercase tracking-widest ml-4 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Mobile Access</label>
                <div className='relative'>
                  <div className={`flex items-center rounded-2xl border transition-all duration-300 ${theme === "dark" ? "bg-zinc-950 border-zinc-800 focus-within:border-indigo-400" : "bg-zinc-50 border-zinc-200 focus-within:border-indigo-600"
                    } ${loginErrors.phoneNumber ? "border-red-500" : ""}`}>
                    <button type='button' className="flex items-center px-4 py-3 gap-2 border-r border-zinc-800/10" onClick={() => setDropDown(!dropDown)}>
                      <span className="text-xl">{country.flag}</span>
                      <span className="font-bold text-sm">{country.dialCode}</span>
                      <FaChevronDown className="text-[10px] opacity-50" />
                    </button>
                    <input type="text"
                      {...loginRegister("phoneNumber")}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder='Phone Number'
                      className="flex-1 bg-transparent py-4 px-4 outline-none font-medium"
                    />
                  </div>
                  {dropDown && (
                    <div className={`absolute z-50 left-0 right-0 mt-2 rounded-2xl border shadow-2xl max-h-60 overflow-y-auto ${theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"}`}>
                      <div className="p-2 sticky top-0 bg-inherit">
                        <input type="text" placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)}
                          className={`w-full p-2 text-sm rounded-xl outline-none border ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200"}`}
                        />
                      </div>
                      {filterCountries.map((c) => (
                        <button key={c.alpha2} type="button" onClick={() => { setCountry(c); setDropDown(false); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${theme === "dark" ? "hover:bg-zinc-800 text-white" : "hover:bg-zinc-100 text-zinc-900"}`}>
                          <span>{c.flag}</span> <span className="font-bold">{c.dialCode}</span> <span className="truncate">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {loginErrors.phoneNumber && <p className='text-red-500 text-xs ml-4'>{loginErrors.phoneNumber.message}</p>}
              </div>

              <div className='flex items-center gap-4 py-2'>
                <div className={`flex-1 h-[1px] ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"}`} />
                <span className={`text-[10px] font-black uppercase ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>OR</span>
                <div className={`flex-1 h-[1px] ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"}`} />
              </div>

              <div className={`flex items-center rounded-2xl border px-5 py-4 transition-all duration-300 ${theme === "dark" ? "bg-zinc-950 border-zinc-800 focus-within:border-indigo-400" : "bg-zinc-50 border-zinc-200 focus-within:border-indigo-600"
                } ${loginErrors.email ? "border-red-500" : ""}`}>
                <FaEnvelope className={`mr-4 ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`} />
                <input type="text"
                  {...loginRegister("email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='Enter Email'
                  className="flex-1 bg-transparent outline-none font-medium" />
              </div>
              {loginErrors.email && <p className='text-red-500 text-xs ml-4'>{loginErrors.email.message}</p>}
            </div>

            <button type='Submit' className={`w-full cursor-pointer rounded-2xl py-4 font-black transition-all active:scale-95 ${theme === "dark" ? "bg-indigo-400 text-zinc-950 shadow-indigo-900/40" : "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
              }`}>
              {loading ? <Spinner /> : "SEND OTP"}
            </button>
          </form>
        )}

        {/* step-2 */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className='space-y-10'>
            <p className={`text-center text-sm font-bold uppercase tracking-widest ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              Verification Required
            </p>
            <div className='flex justify-between gap-2'>
              {otp.map((digit, index) => (
                <input
                  type='text'
                  key={index}
                  id={`otp-${index}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  maxLength={1}
                  className={`w-full h-14 text-center text-xl font-black rounded-xl border transition-all ${theme === "dark"
                      ? "bg-zinc-950 border-zinc-800 text-indigo-400 focus:border-indigo-400"
                      : "bg-zinc-50 border-zinc-200 text-indigo-600 focus:border-indigo-600 shadow-sm"
                    } ${otpErrors?.otp ? "border-red-500" : ""}`}
                />
              ))}
            </div>
            {otpErrors.otp && <p className='text-red-500 text-xs text-center'>{otpErrors.otp.message}</p>}

            <div className="space-y-4">
              <button type='Submit' className={`w-full py-4 cursor-pointer rounded-2xl font-black transition-all ${theme === "dark" ? "bg-indigo-400 text-zinc-950" : "bg-indigo-600 text-white shadow-xl"
                }`}>
                {loading ? <Spinner /> : "VERIFY CODE"}
              </button>
              <button type='button' onClick={handleBack} className={`w-full cursor-pointer text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${theme === "dark" ? "text-zinc-500 hover:text-indigo-400" : "text-zinc-400 hover:text-indigo-600"
                }`}>
                <FaArrowLeft /> Edit Credentials
              </button>
            </div>
          </form>
        )}

        {/* step-3 */}
        {step === 3 && (
          <form className='space-y-8' onSubmit={handleProfileSubmit(onProfileSubmit)}>
            <div className="flex flex-col items-center">
              <div className='relative group'>
                <div className={`w-32 h-32 rounded-[2.5rem] p-1 rotate-3 shadow-2xl transition-transform group-hover:rotate-0 ${theme === "dark" ? "bg-zinc-800" : "bg-zinc-100"}`}>
                  <img src={profilePic || avatar} alt="Profile" className='w-full h-full rounded-[2.3rem] object-cover' />
                </div>
                <label htmlFor="profile-picture" className={`absolute -bottom-2 -right-2 p-3 rounded-2xl cursor-pointer shadow-xl transition-all hover:scale-110 ${theme === "dark" ? "bg-indigo-400 text-zinc-950" : "bg-indigo-600 text-white"}`}>
                  <FaPlus className='h-4 w-4' />
                </label>
                <input type="file" id='profile-picture' accept='image/*' onChange={handleFileChange} className='hidden' />
              </div>
              <div className='flex gap-2 mt-8 overflow-x-auto pb-2 w-full justify-center'>
                {avatars.map((avtr, index) => (
                  <img src={avtr} key={index} className={`w-10 h-10 rounded-xl cursor-pointer transition-all ${avatar === avtr ? "ring-2 ring-indigo-500 scale-110" : "opacity-50 hover:opacity-100"}`}
                    onClick={() => setAvatar(avtr)} />
                ))}
              </div>
            </div>

            <div className='space-y-4'>
              <div className={`flex items-center rounded-2xl border px-5 py-4 ${theme === "dark" ? "bg-zinc-950 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"}`}>
                <FaUser className="mr-4 text-zinc-500" />
                <input
                  {...profileRegister("username")}
                  type='text'
                  placeholder='Username'
                  className="bg-transparent outline-none w-full font-bold"
                />
              </div>
              {profileErrors.username && <p className='text-red-500 text-xs ml-4'>{profileErrors.username.message}</p>}

              <div className='flex items-center gap-3 px-4'>
                <input type="checkbox" id='terms' {...profileRegister("agreed")} className="w-5 h-5 rounded-lg accent-indigo-500" />
                <label htmlFor="terms" className={`text-xs font-medium ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                  Accept <a href="#" className='text-indigo-500 hover:underline'>Terms & Conditions</a>
                </label>
              </div>
              {profileErrors.agreed && <p className='text-red-500 text-xs ml-4'>{profileErrors.agreed.message}</p>}
            </div>

            <button type='Submit' disabled={!watch("agreed") || loading} className={`w-full py-5 rounded-[2rem] font-black transition-all active:scale-95 cursor-pointer ${loading || !watch("agreed") ? "opacity-50" : ""
              } ${theme === "dark" ? "bg-indigo-400 text-zinc-950 shadow-indigo-900/40" : "bg-indigo-600 text-white shadow-xl"}`}>
              {loading ? <Spinner /> : "CREATE PROFILE"}
            </button>
          </form>
        )}
      </motion.div>
    </div>)
}

export default Login