"use server";

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

function getClient() {
    if (!accountSid || !authToken) {
        return null;
    }
    return twilio(accountSid, authToken);
}

export async function sendBookingConfirmation(
    phone: string,
    details: { serviceName: string; date: string; time: string }
): Promise<boolean> {
    const client = getClient();

    const message = `✅ התור שלך אושר!\n${details.serviceName}\n📅 ${details.date} בשעה ${details.time}\n\nנתראה!`;

    if (!client || !messagingServiceSid) {
        console.log("[SMS] Would send confirmation to", phone, ":", message);
        return true; // Fail-open for dev
    }

    try {
        await client.messages.create({
            to: phone,
            messagingServiceSid,
            body: message,
        });
        console.log("[SMS] Confirmation sent to", phone);
        return true;
    } catch (error) {
        console.error("[SMS] Failed to send confirmation:", error);
        return false;
    }
}

export async function sendReminder(
    phone: string,
    details: { serviceName: string; date: string; time: string }
): Promise<boolean> {
    const client = getClient();

    const message = `⏰ תזכורת לתור!\n${details.serviceName}\n📅 היום בשעה ${details.time}\n\nנתראה בקרוב!`;

    if (!client || !messagingServiceSid) {
        console.log("[SMS] Would send reminder to", phone, ":", message);
        return true;
    }

    try {
        await client.messages.create({
            to: phone,
            messagingServiceSid,
            body: message,
        });
        console.log("[SMS] Reminder sent to", phone);
        return true;
    } catch (error) {
        console.error("[SMS] Failed to send reminder:", error);
        return false;
    }
}
