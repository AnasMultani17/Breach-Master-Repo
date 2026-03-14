import imaplib

# Put your EXACT email here
EMAIL = "ekiupadhyay19@gmail.com" 

# Put your BRAND NEW 16-character password here (NO SPACES!)
PASSWORD = "ytyhpbpflyermlep" 

print("Attempting to bypass Google Security...")

try:
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL, PASSWORD)
    print("✅ SUCCESS! The gates are open!")
    mail.logout()
except Exception as e:
    print(f"❌ FAILED: {e}")