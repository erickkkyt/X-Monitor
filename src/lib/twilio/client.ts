import twilio from 'twilio';

// 从环境变量中获取Twilio凭据
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// 确保环境变量存在
if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Twilio凭据未正确配置，确保设置了TWILIO_ACCOUNT_SID、TWILIO_AUTH_TOKEN和TWILIO_PHONE_NUMBER环境变量');
}

// 导出Twilio客户端和电话号码
export const twilioClient = twilio(accountSid, authToken);
export const fromNumber = twilioPhoneNumber; 