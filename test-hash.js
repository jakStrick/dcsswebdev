// Test password hashing to debug login issue
async function hashPassword(password) {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	return hash;
}

// Test with a sample password
const testPassword = "YourPasswordHere"; // Replace with your actual password
hashPassword(testPassword).then((hash) => {
	console.log("Password:", testPassword);
	console.log("Hash:", hash);
	console.log("\nStored hash in DB:");
	console.log(
		"8355c71810516150be7ef5dd20f3ef0fbd35f9f908125c0e267a113be62c5e70"
	);
	console.log(
		"\nMatch:",
		hash ===
			"8355c71810516150be7ef5dd20f3ef0fbd35f9f908125c0e267a113be62c5e70"
	);
});
