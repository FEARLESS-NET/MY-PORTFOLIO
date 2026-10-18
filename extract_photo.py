# Ishlatish:  python extract_photo.py "Mirzohid Bahtiyorov.html"
# Eski HTML faylingiz ichidagi rasmni photo.jpg fayliga chiqarib beradi.
import re, base64, sys
html = open(sys.argv[1], encoding="utf-8").read()
m = re.search(r'data:image/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)', html)
if not m:
    sys.exit("Rasm topilmadi")
open("photo.jpg", "wb").write(base64.b64decode(m.group(1)))
print("photo.jpg tayyor")
