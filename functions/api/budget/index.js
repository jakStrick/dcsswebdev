// Budget API - Get all budget data
export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    // Get user ID from query parameter (in production, use proper auth)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'default';
    
    // Get all data for the user
    const [settings, billAdjustments, paymentStatuses, miscExpenses, surplusSavings] = await Promise.all([
      env.DB.prepare('SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?').bind(userId).all(),
      env.DB.prepare('SELECT bill_name, amount FROM bill_adjustments WHERE user_id = ?').bind(userId).all(),
      env.DB.prepare('SELECT year, month, bill_name, status FROM payment_statuses WHERE user_id = ?').bind(userId).all(),
      env.DB.prepare('SELECT year, month, paycheck_index, amount FROM misc_expenses WHERE user_id = ?').bind(userId).all(),
      env.DB.prepare('SELECT amount FROM surplus_savings WHERE user_id = ?').bind(userId).first()
    ]);
    
    // Transform data into the format expected by the frontend
    const settingsObj = {};
    settings.results.forEach(row => {
      settingsObj[row.setting_key] = row.setting_value;
    });
    
    const billAdjustmentsObj = {};
    billAdjustments.results.forEach(row => {
      billAdjustmentsObj[row.bill_name] = row.amount;
    });
    
    const paymentStatusesObj = {};
    paymentStatuses.results.forEach(row => {
      const key = `${row.year}-${row.month}-${row.bill_name}`;
      paymentStatusesObj[key] = row.status;
    });
    
    const miscExpensesObj = {};
    miscExpenses.results.forEach(row => {
      const key = `${row.year}-${row.month}-Misc-${row.paycheck_index}`;
      miscExpensesObj[key] = row.amount;
    });
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        settings: settingsObj,
        billAdjustments: billAdjustmentsObj,
        paymentStatuses: paymentStatusesObj,
        miscExpenses: miscExpensesObj,
        surplusSavings: surplusSavings?.amount || 0,
        bankBalance: settingsObj.bankBalance || null
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Budget API - Save budget data
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const userId = body.userId || 'default';
    const { type, data } = body;
    
    switch (type) {
      case 'bankBalance':
        await env.DB.prepare(
          'INSERT OR REPLACE INTO user_settings (user_id, setting_key, setting_value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind(userId, 'bankBalance', data.value).run();
        break;
        
      case 'billAdjustments':
        // Delete all existing adjustments for this user, then insert new ones
        await env.DB.prepare('DELETE FROM bill_adjustments WHERE user_id = ?').bind(userId).run();
        for (const [billName, amount] of Object.entries(data)) {
          await env.DB.prepare(
            'INSERT INTO bill_adjustments (user_id, bill_name, amount) VALUES (?, ?, ?)'
          ).bind(userId, billName, amount).run();
        }
        break;
        
      case 'paymentStatus':
        const { year, month, billName, status } = data;
        await env.DB.prepare(
          'INSERT OR REPLACE INTO payment_statuses (user_id, year, month, bill_name, status, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind(userId, year, month, billName, status).run();
        break;
        
      case 'miscExpense':
        const { year: miscYear, month: miscMonth, paycheckIndex, amount } = data;
        await env.DB.prepare(
          'INSERT OR REPLACE INTO misc_expenses (user_id, year, month, paycheck_index, amount, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind(userId, miscYear, miscMonth, paycheckIndex, amount).run();
        break;
        
      case 'surplusSavings':
        await env.DB.prepare(
          'INSERT OR REPLACE INTO surplus_savings (user_id, amount, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
        ).bind(userId, data.amount).run();
        break;
        
      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid data type'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
    }
    
    return new Response(JSON.stringify({
      success: true
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS requests for CORS
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
