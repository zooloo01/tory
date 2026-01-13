import "dotenv/config";
import twilio from "twilio"; // uses 'twilio' package
import { parsePhoneNumber } from "libphonenumber-js";

async function testTwilio() {
    console.log("--- Twilio Integration Test ---");

    // Check Env
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        console.error("❌ CRITICAL: Missing Twilio Credentials in .env");
        console.error("Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN");
        process.exit(1);
    }

    console.log("✅ Credentials found.");
    const client = twilio(accountSid, authToken);

    // Test Numbers
    const testNumbers = [
        "050-1234567", // Valid Format (Mock)
        "03-1234567",  // Landline (Mock) - Should be detected if Lookup works
        "+972558881234" // Valid E.164
    ];

    for (const num of testNumbers) {
        console.log(`\nTesting: ${num}`);
        try {
            // 1. Local Parse
            const parsed = parsePhoneNumber(num, "IL");
            if (!parsed.isValid()) {
                console.log(`  ❌ Invalid Format (libphonenumber)`);
                continue;
            }
            const formatted = parsed.format("E.164");
            console.log(`  ✅ Formatted: ${formatted}`);

            // 2. Lookup
            console.log("  ⏳ Calling Twilio Lookup...");
            const lookup = await client.lookups.v2.phoneNumbers(formatted)
                .fetch({ fields: "line_type_intelligence" });

            console.log("  ✅ Lookup Success!");
            if (lookup.lineTypeIntelligence) {
                console.log(`     Type: ${lookup.lineTypeIntelligence.type}`);
                console.log(`     Carrier: ${lookup.lineTypeIntelligence.carrierName}`);
                console.log(`     Mobile Country Code: ${lookup.lineTypeIntelligence.mobileCountryCode}`);
                console.log(`     Mobile Network Code: ${lookup.lineTypeIntelligence.mobileNetworkCode}`);
            } else {
                console.log("     No line type info returned.");
            }

        } catch (err: any) {
            console.error(`  ❌ Failed: ${err.message}`);
            if (err.code) console.error(`     Twilio Code: ${err.code}`);
        }
    }

    console.log("\n--- Done ---");
}

testTwilio().catch(console.error);
