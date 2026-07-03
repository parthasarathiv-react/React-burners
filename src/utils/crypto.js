import CryptoJS from "crypto-js";

const KEY = CryptoJS.enc.Utf8.parse(
    "12345678901234567890123456789012"
);

const IV = CryptoJS.enc.Utf8.parse(
    "1234567890123456"
);

export const decryptAES = (cipherText) => {
    try {
        const decrypted = CryptoJS.AES.decrypt(
            cipherText,
            KEY,
            {
                iv: IV,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }
        );

        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (err) {
        console.error("Decrypt Error:", err);
        return cipherText;
    }
};