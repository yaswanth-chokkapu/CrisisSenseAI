import { MOCK_CONTACTS } from '../constants/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_STORAGE_KEY = '@emergency_contacts';

// Placeholder credentials (replace with your actual Twilio account details)
const TWILIO_ACCOUNT_SID = 'AC_YOUR_ACCOUNT_SID_HERE'; 
const TWILIO_AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE';
const TWILIO_PHONE_NUMBER = '+1234567890'; // Your Twilio Sender Number

/**
 * Sends a silent SMS fallback via Twilio API
 * @param {Object} locationDetails - Parameters containing latitude, longitude, and potentially address
 */
export const sendSilentSMSFallback = async (locationDetails) => {
  try {
    console.log('[SILENT SMS] Initiating Twilio fallback...');
    
    // Fetch custom user contacts
    let activeContacts = MOCK_CONTACTS;
    try {
      const stored = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) activeContacts = parsed;
      }
    } catch (e) {
      console.warn('[SILENT SMS] Failed to load local contacts, using mock fallback.', e);
    }

    // Format location message
    const lat = locationDetails?.latitude || 'Unknown';
    const lng = locationDetails?.longitude || 'Unknown';
    const messageBody = `CRITICAL ALERT: Emergency detected. Location: https://maps.google.com/?q=${lat},${lng}`;

    // Normally you'd want to send this to an array of contacts. 
    // We'll loop over activeContacts.
    for (const contact of activeContacts) {
      // Clean phone number (Twilio requires E.164 format, e.g., +1234567890)
      const toPhone = contact.phone || '+1234567890';
      
      const details = {
        'To': toPhone,
        'From': TWILIO_PHONE_NUMBER,
        'Body': messageBody
      };

      // URL encode form data since Twilio expects application/x-www-form-urlencoded
      let formBody = [];
      for (let property in details) {
        let encodedKey = encodeURIComponent(property);
        let encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
      }
      formBody = formBody.join("&");

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + window.btoa(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN)
        },
        body: formBody
      });

      const responseJson = await response.json();
      
      if (response.ok) {
        console.log(`[SILENT SMS] Successfully sent to ${contact.name}`);
      } else {
        console.warn(`[SILENT SMS ERROR] Failed to send to ${contact.name}:`, responseJson.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[SILENT SMS CRITICAL FAILURE]', error);
    return false;
  }
};
