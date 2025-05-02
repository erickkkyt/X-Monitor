'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import DashboardHeader from '@/components/DashboardHeader';
import NotificationSettings from '@/components/NotificationSettings'; // Assuming this component exists

// 定义国家代码列表
const countryCodes = [
  { code: '+1', country: '美国' },
  { code: '+86', country: '中国' },
  { code: '+44', country: '英国' },
  { code: '+81', country: '日本' },
  { code: '+82', country: '韩国' },
  { code: '+61', country: '澳大利亚' },
  { code: '+65', country: '新加坡' },
  { code: '+33', country: '法国' },
  { code: '+49', country: '德国' },
  { code: '+39', country: '意大利' }
];

export default function NotificationsPage() {
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  
  const [emailAddress, setEmailAddress] = useState('user@example.com');
  const [telegramId, setTelegramId] = useState('@user_telegram');
  const [discordWebhook, setDiscordWebhook] = useState('');
  
  // 修改电话相关状态
  const [countryCode, setCountryCode] = useState('+86');
  const [phoneNumberValue, setPhoneNumberValue] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  
  const [keywordAlerts, setKeywordAlerts] = useState(['重要', '发布', '更新', '公告']);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  
  const supabase = createClient();
  
  // 验证电话号码格式
  const validatePhoneNumber = (number) => {
    if (!number.trim() && !phoneEnabled) return true; // 如果未启用电话通知，则不验证
    
    // 根据国家代码验证格式
    if (countryCode === '+1') {
      // 美国格式: NXX-NXX-XXXX，N=2-9, X=0-9
      const usRegex = /^[2-9]\d{2}[2-9]\d{6}$/;
      return usRegex.test(number.replace(/\D/g, ''));
    } else if (countryCode === '+86') {
      // 中国格式: 1XX-XXXX-XXXX
      const cnRegex = /^1\d{10}$/;
      return cnRegex.test(number.replace(/\D/g, ''));
    } else {
      // 其他国家的通用验证：至少5位数字
      const generalRegex = /^\d{5,15}$/;
      return generalRegex.test(number.replace(/\D/g, ''));
    }
  };
  
  // 更新完整电话号码（带国家代码）
  const updateFullPhoneNumber = (code, number) => {
    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber) {
      setPhoneNumber(`${code}${cleanNumber}`);
    } else {
      setPhoneNumber('');
    }
  };
  
  // 处理国家代码变更
  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    updateFullPhoneNumber(newCode, phoneNumberValue);
    
    // 重新验证电话号码
    if (phoneNumberValue) {
      if (!validatePhoneNumber(phoneNumberValue)) {
        setPhoneError('电话号码格式不正确');
      } else {
        setPhoneError('');
      }
    }
  };
  
  // 处理电话号码输入
  const handlePhoneNumberChange = (e) => {
    const newValue = e.target.value;
    setPhoneNumberValue(newValue);
    updateFullPhoneNumber(countryCode, newValue);
    
    // 验证新输入的号码
    if (newValue) {
      if (!validatePhoneNumber(newValue)) {
        setPhoneError('电话号码格式不正确');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };
  
  useEffect(() => {
    async function loadUserPreferences() {
      try {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error && error.code !== 'PGRST116') {
            console.error('加载用户偏好设置失败:', error);
          } else if (data) {
            // 处理加载的电话号码，提取国家代码和号码部分
            if (data.phone_number) {
              // 假设号码格式为 +XX... 
              const fullNumber = data.phone_number;
              
              // 查找匹配的国家代码
              const foundCode = countryCodes.find(c => fullNumber.startsWith(c.code));
              if (foundCode) {
                setCountryCode(foundCode.code);
                setPhoneNumberValue(fullNumber.substring(foundCode.code.length));
              } else {
                // 如果没找到匹配的国家代码，使用默认值
                setCountryCode('+86');
                setPhoneNumberValue(fullNumber.startsWith('+') ? fullNumber.substring(1) : fullNumber);
              }
              
              setPhoneNumber(fullNumber);
            }
            
            setPhoneEnabled(data.phone_notifications_enabled || false);
          }
        }
      } catch (error) {
        console.error('获取用户设置出错:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserPreferences();
  }, [supabase]);
  
  const saveUserPreferences = async () => {
    // 如果启用了电话通知但格式不正确，则阻止保存
    if (phoneEnabled && phoneError) {
      alert('请先修正电话号码格式');
      return;
    }

    try {
      setSaveStatus('saving');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            phone_number: phoneEnabled ? phoneNumber : null, // 只有启用时才保存电话号码
            phone_notifications_enabled: phoneEnabled,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'user_id' 
          });
          
        if (error) {
          console.error('保存用户偏好设置失败:', error);
          setSaveStatus('error');
        } else {
          setSaveStatus('success');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      }
    } catch (error) {
      console.error('保存设置出错:', error);
      setSaveStatus('error');
    }
  };
  
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywordAlerts.includes(newKeyword.trim())) {
      setKeywordAlerts([...keywordAlerts, newKeyword.trim()]);
      setNewKeyword('');
    }
  };
  
  const handleRemoveKeyword = (keyword) => {
    setKeywordAlerts(keywordAlerts.filter(k => k !== keyword));
  };

  return (
    <div className="min-h-screen bg-[#0f1218] text-white">
      <DashboardHeader />

      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">通知设置</h2>
          
          <button 
            onClick={saveUserPreferences}
            disabled={loading || saveStatus === 'saving'}
            className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
              saveStatus === 'error' ? 'bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saveStatus === 'saving' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </>
            ) : saveStatus === 'error' ? (
              '保存失败'
            ) : saveStatus === 'success' ? (
              '已保存✓'
            ) : (
              '保存设置'
            )}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1c2128] rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">通知渠道</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#161b22] rounded-md">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="w-full">
                    <p className="font-medium">电话通知</p>
                    <div className="flex mt-1">
                      <select
                        value={countryCode}
                        onChange={handleCountryCodeChange}
                        className="bg-[#0d1117] border border-gray-700 rounded-l px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={!phoneEnabled}
                      >
                        {countryCodes.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.code} {country.country}
                          </option>
                        ))}
                      </select>
                      <input 
                        type="tel" 
                        value={phoneNumberValue}
                        onChange={handlePhoneNumberChange}
                        className={`flex-1 bg-[#0d1117] border-y border-r border-gray-700 rounded-r px-3 py-1 text-sm focus:outline-none focus:ring-1 ${
                          phoneError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                        }`}
                        placeholder={countryCode === '+86' ? "138xxxx xxxx" : "123-456-7890"}
                        disabled={!phoneEnabled}
                      />
                    </div>
                    {phoneError && (
                      <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                    )}
                    {!phoneError && (
                      <p className="text-xs text-gray-400 mt-1">
                        {countryCode === '+86' ? '请输入11位手机号码 (不含国家代码)' : '请输入10位电话号码 (不含国家代码)'}
                      </p>
                    )}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input 
                    type="checkbox" 
                    checked={phoneEnabled} 
                    onChange={() => setPhoneEnabled(!phoneEnabled)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#161b22] rounded-md">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium">电子邮件</p>
                    <input 
                      type="email" 
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="mt-1 bg-[#0d1117] border border-gray-700 rounded px-3 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="输入邮箱地址"
                    />
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailEnabled} 
                    onChange={() => setEmailEnabled(!emailEnabled)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#161b22] rounded-md">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <div>
                    <p className="font-medium">Telegram</p>
                    <input 
                      type="text" 
                      value={telegramId}
                      onChange={(e) => setTelegramId(e.target.value)}
                      className="mt-1 bg-[#0d1117] border border-gray-700 rounded px-3 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="输入Telegram ID"
                    />
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={telegramEnabled} 
                    onChange={() => setTelegramEnabled(!telegramEnabled)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#161b22] rounded-md">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div>
                    <p className="font-medium">Discord</p>
                    <input 
                      type="text" 
                      value={discordWebhook}
                      onChange={(e) => setDiscordWebhook(e.target.value)}
                      className="mt-1 bg-[#0d1117] border border-gray-700 rounded px-3 py-1 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="输入Discord Webhook URL"
                    />
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={discordEnabled} 
                    onChange={() => setDiscordEnabled(!discordEnabled)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-[#161b22] rounded-md">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <p className="font-medium">浏览器推送</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={webPushEnabled} 
                    onChange={() => setWebPushEnabled(!webPushEnabled)} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1c2128] rounded-lg p-6 shadow-lg">
            {/* 紧凑型升级提示框 */}
            <div className="mb-6 bg-[#182032] border border-blue-500 rounded-md p-4 shadow flex flex-col items-center">
              <div className="flex items-center w-full justify-center mb-2">
                <svg className="w-7 h-7 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-blue-100 text-sm">免费计划不支持更多的通知规则设置，请升级版本。</span>
              </div>
              <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-md text-base transition-colors duration-200 flex items-center justify-center mt-1" onClick={() => window.location.href = '/pricing'}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                升级计划
              </button>
            </div>
            
            <h3 className="text-xl font-semibold mb-4">通知规则</h3>
            
            {/* 通知频率提前 */}
            <div className="mb-6 opacity-75">
              <p className="font-medium mb-2">通知频率</p>
              <select className="bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-not-allowed opacity-75" disabled>
                <option>15分钟</option>
                <option>10分钟</option>
                <option>5分钟</option>
                <option>1分钟</option>
              </select>
            </div>

            {/* 免打扰时间后置 */}
            <div className="mb-6 opacity-75">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">免打扰时间</p>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input 
                    type="checkbox" 
                    checked={quietHoursEnabled} 
                    onChange={() => setQuietHoursEnabled(!quietHoursEnabled)} 
                    className="sr-only peer"
                    disabled
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 opacity-60"></div>
                </label>
              </div>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">开始时间</label>
                  <input 
                    type="time" 
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    className="bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-not-allowed"
                    disabled
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">结束时间</label>
                  <input 
                    type="time" 
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    className="bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            </div>
            
            <div>
              <p className="font-medium mb-2">关键词触发</p>
              <div className="flex mb-2">
                <input 
                  type="text" 
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="添加关键词..."
                  className="flex-1 bg-[#0d1117] border border-gray-700 rounded-l px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-not-allowed opacity-75"
                  disabled
                />
                <button 
                  onClick={handleAddKeyword}
                  className="bg-blue-600 text-white rounded-r px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-75 cursor-not-allowed"
                  disabled
                >
                  添加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywordAlerts.map((keyword, index) => (
                  <div key={index} className="flex items-center bg-[#0d1117] rounded-full px-3 py-1 opacity-75">
                    <span className="text-sm">{keyword}</span>
                    <button 
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-2 text-gray-400 cursor-not-allowed"
                      disabled
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-[#1c2128] rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-3">关于电话通知</h3>
          <p className="text-gray-300 text-sm mb-4">
            启用电话通知后，当您监控的Twitter账号发布重要更新时，系统将自动拨打电话通知您，并语音朗读推文内容。
          </p>
          <div className="bg-[#23272f] bg-opacity-80 border border-yellow-600 rounded-md p-4">
            <div className="flex">
              <svg className="w-6 h-6 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium text-yellow-300">使用提示</h4>
                <ul className="list-disc list-inside text-yellow-100 text-sm mt-2 space-y-1">
                  <li>请确保输入的电话号码格式正确，以国际格式填写（如：+86 138xxxx xxxx）</li>
                  <li>每次通知仅朗读最新的一条推文内容</li>
                  <li>升级版本后，通知将遵循免打扰时间设置</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}