import imaplib
import email
import os
import cloudinary
import cloudinary.uploader
from flask import Flask, jsonify

app = Flask(__name__)

# --- EMAIL CREDENTIALS ---
EMAIL_ADDRESS = "ekiupadhyay@gmail.com"
EMAIL_PASSWORD = "orjnodsfrybbgjjp" # Ensure this matches your active App Password
# -------------------------

# --- CLOUDINARY CREDENTIALS ---
cloudinary.config( 
    cloud_name = "di92sus72", 
    api_key = "132613785828386", 
    api_secret = "QvV5ZUQR-J0BBzxTsGH_GArhUUA" 
)
# ------------------------------

# --- BUZZWORDS TO FILTER BY ---
# Ensure all words are lowercase here.
BUZZWORDS = ["resume", "application", "job", "cv", "hiring", "role", "intern", "software"]

@app.route('/api/fetch-resume', methods=['GET'])
def fetch_unread_emails_api():
    print(">>> API Called: Connecting to Gmail...")
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        mail.select("inbox")

        print(">>> Searching for unread emails...")
        status, response = mail.search(None, '(UNSEEN)')
        unread_msg_nums = response[0].split()

        # --- THE NEW UPDATE ---
        # Strictly slice the array to only keep the 10 most recent unread emails.
        if len(unread_msg_nums) > 10:
            unread_msg_nums = unread_msg_nums[-10:]
        # ----------------------

        if len(unread_msg_nums) == 0:
            return jsonify({"error": "No unread emails found"}), 404

        print(f">>> Found {len(unread_msg_nums)} recent unread emails. Scanning for buzzwords...")
        
        # Loop through these 10 emails from NEWEST to OLDEST
        for e_id in reversed(unread_msg_nums):
            _, msg_data = mail.fetch(e_id, "(RFC822)")
            
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    
                    # Safely grab the subject
                    raw_subject = msg["subject"]
                    subject = str(raw_subject).lower() if raw_subject else ""
                    from_ = msg["from"]

                    body = ""
                    filepaths_to_upload = [] 

                    # 1. Walk through the email to extract text AND save attachments temporarily
                    for part in msg.walk():
                        # Grab text body
                        if part.get_content_type() == "text/plain" and part.get('Content-Disposition') is None:
                            body = part.get_payload(decode=True).decode(errors='ignore') 
                        
                        # Grab attachments temporarily (we will delete them later if it's not a job email)
                        if part.get('Content-Disposition') is not None:
                            filename = part.get_filename()
                            if filename:
                                filepath = os.path.join(os.getcwd(), filename)
                                with open(filepath, "wb") as f:
                                    f.write(part.get_payload(decode=True))
                                filepaths_to_upload.append(filepath)

                    # 2. Check if this is a job-related email
                    text_to_search = f"{subject} {body}".lower()
                    is_job_email = any(word in text_to_search for word in BUZZWORDS)

                    if is_job_email:
                        print(f"\n--- Processing MATCHED Email from: {from_} ---")
                        attachment_urls = []
                        
                        # Upload the saved attachments to Cloudinary
                        for filepath in filepaths_to_upload:
                            try:
                                print(f"  [+] Uploading '{os.path.basename(filepath)}' to Cloudinary...")
                                result = cloudinary.uploader.upload(filepath, resource_type="auto")
                                attachment_urls.append(result.get("secure_url"))
                                print(f"  [+] SUCCESS! Cloudinary URL generated.")
                            except Exception as e:
                                print(f"  [-] Error uploading to Cloudinary: {e}")
                            finally:
                                # Clean up local file after upload
                                if os.path.exists(filepath):
                                    os.remove(filepath)

                        # Format the exact JSON structure you requested
                        # Use the original raw_subject so it maintains proper capitalization
                        combined_text = f"Subject: {raw_subject}\nFrom: {from_}\n\n{body}"
                        final_pdf_url = attachment_urls[0] if len(attachment_urls) > 0 else ""

                        final_response = {
                            "email_text": combined_text.strip(),
                            "pdf_url": final_pdf_url
                        }

                        mail.logout()
                        return jsonify(final_response), 200
                        
                    else:
                        # NOT A JOB EMAIL. 
                        # Clean up any temporary files that were downloaded and skip to the next email.
                        print(f"Skipping unrelated email from: {from_}")
                        for filepath in filepaths_to_upload:
                            if os.path.exists(filepath):
                                os.remove(filepath)

        # If the loop finishes and none of the 10 unread emails contained buzzwords
        mail.logout()
        return jsonify({"error": "No unread job/resume emails found in the latest 10 messages."}), 404

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Runs the API on port 5000
    app.run(port=5000, debug=True)