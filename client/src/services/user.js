import { toast } from "react-toastify"
import axiosInstance from "./url"


export const sendOtp = async (phoneNumber,phoneSuffix,email) => {
    try {
        const response = await axiosInstance.post("/auth/send-otp" , {phoneNumber,phoneSuffix,email})
        return response.data
        console.log(response.data)
    } catch (error) {
        
    }
}

export const verifyOtp = async (phoneNumber,phoneSuffix,otp,email) => {
    try {
        const response = await axiosInstance.post("/auth/verify-otp" , {phoneNumber,phoneSuffix,otp,email})
        return response.data
    } catch (error) {
        
    }
}
export const updateUserProfile = async (updateData) => {
    try {
        const response = await axiosInstance.put("/auth/update-profile" , updateData)
        return response.data
    } catch (error) {
        toast.error(error.message)
    }
}
export const checkUserAuth = async () => {
  try {
    const response = await axiosInstance.get("/auth/check-auth");
    if (response.data.success === true) {
      return { isAuthenticated: true, user: response?.data.user };
    } else {
      return { isAuthenticated: false };
    }
  } catch (error) {
    console.error("Auth check failed:", error?.response?.data || error.message);
    return { isAuthenticated: false };
  }
};
export const logoutUser = async () => {
    try {
        const response = await axiosInstance.get("/auth/logout")
        return response.data
    } catch (error) {
        
    }
}
export const getAllUsers = async () => {
    try {
        const response = await axiosInstance.get("/auth/users")
        return response.data
    } catch (error) {
        
    }
}