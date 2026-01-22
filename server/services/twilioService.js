import twilio from "twilio"

const accountSid =process.env.TWILIO_ACCOUNT_SID
const authToken =process.env.TWILIO_AUTH_TOKEN
const serviceSid =process.env.TWILLO_SERVICE_SID


const client = twilio(accountSid,authToken)

export const sendOtpToPhn = async (phoneNumber) => {
    try {
        if(!phoneNumber){
            throw new Error("Phone number is required")

        }
        const response = await client.verify.v2.services(serviceSid).verifications.create({
            to:phoneNumber,
            channel:"sms"
        })
        return response
    } catch (error) {
       throw new Error(error.message) 
    }
}
export const verifyOtpPhn = async (phoneNumber,otp) => {
    try {
        if(!phoneNumber){
            throw new Error("Phone number is required")

        }
        const response = await client.verify.v2.services(serviceSid).verificationChecks.create({
            to:phoneNumber,
            code:otp
        })
        return response
    } catch (error) {
       throw new Error("otp verification failed") 
    }

}