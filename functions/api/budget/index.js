// Budget API - Get all budget data
export async function onRequestGet(context) {
	const { request, env } = context;

	try {
		// Get user ID from query parameter (in production, use proper auth)
		const url = new URL(request.url);
		const userId = url.searchParams.get("userId") || "default";

		// Get all data for the user
		const [
			settings,
			billAdjustments,
			paymentStatuses,
			miscExpenses,
			surplusSavings,
			deposits,
			customBills,
		] = await Promise.all([
			env.DB.prepare(
				"SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?"
			)
				.bind(userId)
				.all(),
			env.DB.prepare(
				"SELECT bill_name, amount FROM bill_adjustments WHERE user_id = ?"
			)
				.bind(userId)
				.all(),
			env.DB.prepare(
				"SELECT year, month, bill_name, status FROM payment_statuses WHERE user_id = ?"
			)
				.bind(userId)
				.all(),
			env.DB.prepare(
				"SELECT year, month, paycheck_index, amount, data FROM misc_expenses WHERE user_id = ?"
			)
				.bind(userId)
				.all(),
			env.DB.prepare("SELECT amount FROM surplus_savings WHERE user_id = ?")
				.bind(userId)
				.first(),
			env.DB.prepare(
				"SELECT year, month, data FROM deposits WHERE user_id = ?"
			)
				.bind(userId)
				.all(),
			env.DB.prepare(
				"SELECT id, name, category, amount, balance, due_day, ach, type, priority, adjustable, deleted FROM bills WHERE user_id = ?"
			)
				.bind(userId)
				.all(),
		]);

		// Transform data into the format expected by the frontend
		const settingsObj = {};
		settings.results.forEach((row) => {
			settingsObj[row.setting_key] = row.setting_value;
		});

		const billAdjustmentsObj = {};
		billAdjustments.results.forEach((row) => {
			billAdjustmentsObj[row.bill_name] = row.amount;
		});

		const paymentStatusesObj = {};
		paymentStatuses.results.forEach((row) => {
			const key = `${row.year}-${row.month}-${row.bill_name}`;
			paymentStatusesObj[key] = row.status;
		});

		const miscExpensesObj = {};
		miscExpenses.results.forEach((row) => {
			const key = `${row.year}-${row.month}-Misc-${row.paycheck_index}`;
			// Use data column if available (new format with entries), otherwise use amount (old format)
			if (row.data) {
				try {
					miscExpensesObj[key] = JSON.parse(row.data);
				} catch {
					miscExpensesObj[key] = row.amount;
				}
			} else {
				miscExpensesObj[key] = row.amount;
			}
		});

		const depositsObj = {};
		deposits.results.forEach((row) => {
			const key = `${row.year}-${row.month}`;
			if (row.data) {
				try {
					depositsObj[key] = JSON.parse(row.data);
				} catch {
					depositsObj[key] = { total: 0, entries: [] };
				}
			}
		});

		const customBillsArray = customBills.results.map((row) => ({
			id: row.id,
			name: row.name,
			category: row.category,
			amount: row.amount,
			balance: row.balance,
			dueDay: row.due_day,
			ach: row.ach === 1,
			type: row.type,
			priority: row.priority,
			adjustable: row.adjustable === 1,
			deleted: row.deleted === 1,
			custom: true,
		}));

		return new Response(
			JSON.stringify({
				success: true,
				data: {
					settings: settingsObj,
					billAdjustments: billAdjustmentsObj,
					paymentStatuses: paymentStatusesObj,
					miscExpenses: miscExpensesObj,
					surplusSavings: surplusSavings?.amount || 0,
					deposits: depositsObj,
					customBills: customBillsArray,
					bankBalance: settingsObj.bankBalance || null,
				},
			}),
			{
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message,
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			}
		);
	}
}

// Budget API - Save budget data
export async function onRequestPost(context) {
	const { request, env } = context;

	try {
		const body = await request.json();
		const userId = body.userId || "default";
		const { type, data } = body;

		switch (type) {
			case "bankBalance":
				await env.DB.prepare(
					"INSERT OR REPLACE INTO user_settings (user_id, setting_key, setting_value, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)"
				)
					.bind(userId, "bankBalance", data.value)
					.run();
				break;

			case "billAdjustments":
				// Delete all existing adjustments for this user, then insert new ones
				await env.DB.prepare(
					"DELETE FROM bill_adjustments WHERE user_id = ?"
				)
					.bind(userId)
					.run();
				for (const [billName, amount] of Object.entries(data)) {
					await env.DB.prepare(
						"INSERT INTO bill_adjustments (user_id, bill_name, amount) VALUES (?, ?, ?)"
					)
						.bind(userId, billName, amount)
						.run();
				}
				break;

			case "paymentStatus":
				const { year, month, billName, status } = data;
				await env.DB.prepare(
					"INSERT OR REPLACE INTO payment_statuses (user_id, year, month, bill_name, status, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
				)
					.bind(userId, year, month, billName, status)
					.run();
				break;

			case "miscExpense":
				const {
					year: miscYear,
					month: miscMonth,
					paycheckIndex,
					data: miscData,
				} = data;
				const dataToSave = miscData ? JSON.stringify(miscData) : null;
				await env.DB.prepare(
					"INSERT OR REPLACE INTO misc_expenses (user_id, year, month, paycheck_index, amount, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)"
				)
					.bind(
						userId,
						miscYear,
						miscMonth,
						paycheckIndex,
						miscData?.total || 0,
						dataToSave
					)
					.run();
				break;

			case "deposit":
				const { year: depYear, month: depMonth, data: depData } = data;
				const depositDataToSave = depData ? JSON.stringify(depData) : null;
				await env.DB.prepare(
					"INSERT OR REPLACE INTO deposits (user_id, year, month, data, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)"
				)
					.bind(userId, depYear, depMonth, depositDataToSave)
					.run();
				break;

			case "surplusSavings":
				await env.DB.prepare(
					"INSERT OR REPLACE INTO surplus_savings (user_id, amount, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)"
				)
					.bind(userId, data.amount)
					.run();
				break;

			case "addBill":
				const {
					name,
					category,
					amount,
					balance,
					dueDay,
					ach,
					type,
					priority,
					adjustable,
				} = data;
				await env.DB.prepare(
					"INSERT INTO bills (user_id, name, category, amount, balance, due_day, ach, type, priority, adjustable, deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
				)
					.bind(
						userId,
						name,
						category,
						amount,
						balance || 0,
						dueDay,
						ach ? 1 : 0,
						type,
						priority,
						adjustable ? 1 : 0
					)
					.run();
				break;

			case "deleteBill":
				const { billId } = data;
				await env.DB.prepare(
					"UPDATE bills SET deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
				)
					.bind(billId, userId)
					.run();
				break;

			default:
				return new Response(
					JSON.stringify({
						success: false,
						error: "Invalid data type",
					}),
					{
						status: 400,
						headers: {
							"Content-Type": "application/json",
							"Access-Control-Allow-Origin": "*",
						},
					}
				);
		}

		return new Response(
			JSON.stringify({
				success: true,
			}),
			{
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message,
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			}
		);
	}
}

// Handle OPTIONS requests for CORS
export async function onRequestOptions() {
	return new Response(null, {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		},
	});
}
