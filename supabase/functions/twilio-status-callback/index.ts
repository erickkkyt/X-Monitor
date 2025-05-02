import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log('Initializing Twilio Status Callback Function...');

serve(async (req) => {
  try {
    // 获取环境变量
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('缺少必要的环境变量');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 解析请求体
    const formData = await req.formData();
    
    // 获取Twilio回调参数
    const callSid = formData.get('CallSid')?.toString();
    const callStatus = formData.get('CallStatus')?.toString();
    const callDuration = formData.get('CallDuration')?.toString();

    console.log(`收到Twilio回调: SID=${callSid}, 状态=${callStatus}, 时长=${callDuration}`);

    if (!callSid || !callStatus) {
      return new Response(
        JSON.stringify({ error: '缺少必要的回调参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 将状态更新保存到数据库
    const { error } = await supabase
      .from('call_status_updates')
      .insert({
        call_sid: callSid,
        status: callStatus,
        duration: callDuration ? parseInt(callDuration, 10) : null
      });

    if (error) {
      console.error('保存状态更新失败:', error);
      return new Response(
        JSON.stringify({ error: '数据库操作失败' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 返回成功响应
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('处理Twilio回调时出错:', error);
    return new Response(
      JSON.stringify({ error: '服务器内部错误' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 