import React, { useState } from 'react'
import loginStore from '../../store/loginStore'
import countries from "../../utils/Countries"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import userStore from '../../store/userStore'
import { useForm } from 'react-hook-form'
import avatars from '../../utils/avatars'
import themeStore from '../../store/themeStore'
import { data, useNavigate } from "react-router-dom";
import { motion } from "framer-motion"
import { FaArrowLeft, FaChevronDown, FaPlus, FaUser, FaWhatsapp } from "react-icons/fa6"
import Spinner from '../../utils/Spinner'
import { sendOtp, updateUserProfile, verifyOtp } from '../../services/user'
import { toast } from 'react-toastify'

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
        localStorage.setItem("auth_token" , token)
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
    <div className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2.5 mb-6`}>
      <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${(step / 3) * 100}%` }}>
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
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 " : "bg-gradient-to-br from-green-400 to-blue-500"} flex items-center justify-center p-4 overflow-hidden relative`}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"} p-6 md:p-8  rounded-lg shadow-2xl w-full max-w-md relative z-10`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 260, damping: 20 }}
          className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
        >
          <FaWhatsapp className="w-16 h-16 text-white" />
        </motion.div>

        <h1 className={`text-3xl font-bold text-center mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
          Chatify Login
        </h1>
        <PrograssBar />
        {error && <p className='text-red-500 text-center mb-4'>{error}</p>}
        {step === 1 && (
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className='space-y-4'>
            <p className={`text-center ${theme === "dark" ? " text-gray-300" : "text-gray-600"} mb-4`}>Enter your phone number to recieve otp</p>
            <div className='relative'>
              <div className='flex'>
                <div className='relative w-1/3'>
                  <button type='button' className={`flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center ${theme === "dark" ? "text-white bg-gray-700 border-gray-600" : "text-gray-900 bg-gray-100 border-gray-300"} border rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100`} onClick={() => setDropDown(true)}>
                    <span>
                      {country.flag} {country.dialCode}
                    </span>

                    <FaChevronDown className='ml-2' />
                  </button>
                  {dropDown && (
                    <div className={`absolute z-50 w-full mt-1
                               ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}
                                    border rounded-md shadow-lg max-h-60 overflow-auto`}
                    >
                      <div className={`sticky top-0 ${theme === "dark" ? "bg-gray-700" : "bg-white"} p-2`}>
                        <input type="text" placeholder='Search Country' value={search} onChange={(e) => setSearch(e.target.value)} className={`w-full px-2 py-1 appearance-none
                            ${theme === "dark"
                            ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-black placeholder-gray-500"}
                             border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500`}
                        />

                      </div>
                      {filterCountries.map((country) => (
                        <button
                          key={country.alpha2}
                          type="button"
                          onClick={() => {
                            setCountry(country)
                            setDropDown(false)
                          }}
                          className={`w-full text-left px-3 py-2
                             appearance-none bg-transparent
                                          ${theme === "dark"
                              ? "text-white hover:bg-gray-600"
                              : "text-black hover:bg-gray-100"}
                                          focus:outline-none focus:ring-0
                                       transition-colors duration-150
                                   `}
                        >
                          {country.flag} ({country.dialCode}) {country.name}
                        </button>
                      ))}

                    </div>
                  )}
                </div>
                <input type="text"
                  {...loginRegister("phoneNumber")}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder='Phone Number'
                  className={`w-2/3 px-4 py-2 appearance-none
                              ${theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-black placeholder-gray-500"}
                               border rounded-e-md focus:outline-none focus:ring-2 focus:ring-green-500
                      ${loginErrors.phoneNumber ? "border-red-500" : ""}
                        `}
                />
              </div>
              {loginErrors.phoneNumber && (
                <p className='text-red-500 text-sm'>
                  {loginErrors.phoneNumber.message}
                </p>
              )}
            </div>
            {/* divider */}
            <div className='flex items-center my-4'>
              <div className='flex-grow h-px bg-gray-300' />
              <span className='mx-3 text-gray-500 text-sm font-medium'>Or</span>
              <div className='flex-grow h-px bg-gray-300' />
            </div>

            {/* Email box*/}
            <div className={`flex items-center border rounded-md px-3 py-2 ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}>
              <FaUser className={`mr-2 text-gray-400 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
              <input type="text"
                {...loginRegister("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter Email'
                className={`w-w-full bg-transparent focus:outline-none ${theme === "dark" ? "text-white" : "text-black"} ${loginErrors.email ? "border-red-500" : ""}`} />
              {loginErrors.email && (
                <p className='text-red-500 text-sm'>
                  {loginErrors.email.message}
                </p>
              )}
            </div>
            <button type='Submit' className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition'>
              {loading ? <Spinner /> : "Send Otp"}
            </button>
          </form>
        )}
        {/* step-2 */}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className='space-y-4'>
            <p className={`text-center ${theme === "dark" ? "text-gray-300" : " text-gray-600"} mb-4`}>
              Please enter OTP
            </p>
            <div className='flex justify-between'>
              {otp.map((digit, index) => (
                <input
                  type='text'
                  key={index}
                  id={`otp-${index}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  maxLength={1}
                  className={`w-12 h-12 text-center border ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${otpErrors?.otp ? "border-red-500" : ""
                    }`}
                />
              ))}

            </div>
            {otpErrors.otp && (
              <p className='text-red-500 text-sm'>
                {otpErrors.otp.message}
              </p>
            )}
            <button type='Submit' className='w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition'>
              {loading ? <Spinner /> : "Verify Otp"}
            </button>
            <button type='button' onClick={handleBack} className={`w-full mt-2 ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"} rounded-md py-2 hover:bg-gray-300 transition flex items-center justify-center`}>
              <FaArrowLeft className='mr-2' />
              Wrong number ? Go Back
            </button>
          </form>
        )}

        {/* step-3 */}

        {step === 3 && (
          <form className='space-y-4' onSubmit={handleProfileSubmit(onProfileSubmit)}>
            <div className="flex flex-col items-center mb-4">
              <div className='relative w-24 h-24 mb-2'>
                <img src={profilePic || avatar} alt="Profile Pic"
                  className='w-full h-full rounded-full object-cover'
                />
                <label htmlFor="profile-picture" className='absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition duration-300'>
                  <FaPlus className='h-4 w-4' />
                </label>
                <input type="file" id='profile-picture' accept='image/*'
                  onChange={handleFileChange}
                  className='hidden' />
              </div>
              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"} mb-2`}>
                Choose Avatar
              </p>
              <div className='flex flex-wrap justify-center gap-2'>
                {avatars.map((avtr, index) => (
                  <img src={avtr} key={index} className={`w-12 h-12 rounded-full cursor-pointer transition duration-300 ease-in-out transform hover:scale-110 ${avatar === avtr ? "ring-2 ring-green-500" : ""}`}
                    onClick={() => setAvatar(avtr)} />
                ))}
              </div>
            </div>
            <div className='relative'>
              <FaUser className={`absolute left-3 top-1/2  -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`} />
              <input
                {...profileRegister("username")}
                type='text'
                placeholder='Username'
                className={`w-full pl-10 pr-3 py-2 border ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg`}
              />
              {profileErrors.username && (
                <p className='text-red-500 text-sm mt-1'>
                  {profileErrors.username.message}
                </p>
              )}
            </div>
            <div className='flex items-center space-x-2'>
              <input type="checkbox" id='terms'
                {...profileRegister("agreed")}
                className={`rounded ${theme === "dark" ? "text-green-500 bg-gray-700" : "text-green-500"} focus:ring-green-500`} />
              <label htmlFor="terms"
                className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                I agree to the {" "}
                <a href="#" className='text-red-500 hover:underline'>
                  Terms and Conditions
                </a>
              </label>
            </div>
            {profileErrors.agreed && (
              <p className='text-red-500 text-sm mt-1'>
                {profileErrors.agreed.message}
              </p>
            )}
            <button type='Submit' disabled={!watch("agreed") || loading} className={`w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-lg ${loading ? "opacity-50 cursor-not-allowed" : ""}`}>
              {loading ? <Spinner /> : "Create Profile"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

export default Login