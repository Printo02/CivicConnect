import re
from django.utils.text import slugify

def generate_dept_email(deptname, domain="kerala.gov.in"):
    """
    Converts 'Public Works Department' -> 'publicworksdepartment@yourorg.gov.in'
    Appends a numeric suffix if the email already exists.
    """
    from .models import Dept

    base = slugify(deptname).replace("-", "")  # 'public-works' -> 'publicworks'
    base = re.sub(r"[^a-z0-9]", "", base.lower())

    email = f"{base}@{domain}"
    counter = 1
    while Dept.objects.filter(email=email).exists():
        email = f"{base}{counter}@{domain}"
        counter += 1

    return email