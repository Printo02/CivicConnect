from django.db import models
from django.contrib.auth.models import User


class UserDetail(models.Model):
  user = models.OneToOneField(User,on_delete=models.CASCADE,related_name="profile")
  phone = models.CharField(max_length=10,blank=True,null=True)
  dob = models.DateField(blank=True,null=True)
  address = models.TextField(max_length=250,blank=True,null=True)
  image = models.ImageField(upload_to= 'profile_imgs/',blank=True,null=True)
  role = models.CharField(max_length=50,default="user",blank=True,null=True)
  
  def __str__(self):
    return self.user.username    

class District(models.Model):
  dname = models.CharField(max_length=50,blank=True,null=True)

class Dept(models.Model):
    deptname = models.CharField(max_length=250, blank=True, null=True)
    email = models.EmailField(max_length=100, unique=True, blank=True, null=True)
    password = models.CharField(max_length=128, blank=True, null=True)  # hashed
    is_active = models.BooleanField(default=True)

    def set_password(self, raw_password):
        from django.contrib.auth.hashers import make_password
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.deptname


class DeptDetails(models.Model):
    dept = models.ForeignKey(Dept, on_delete=models.CASCADE, related_name="branches")
    email = models.EmailField(max_length=100, unique=True, blank=True, null=True)  # auto-generated login
    password = models.CharField(max_length=128, blank=True, null=True)  # hashed
    phone = models.CharField(max_length=15, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    website = models.URLField(max_length=200, null=True, blank=True)
    urls = models.URLField(max_length=200, null=True, blank=True)
    region = models.ForeignKey(District, on_delete=models.CASCADE, related_name="regions", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def set_password(self, raw_password):
        from django.contrib.auth.hashers import make_password
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password)

    def __str__(self):
        return f"{self.dept.deptname} - {self.region}"



class DeptEmployees(models.Model):
  dept_details = models.ForeignKey(DeptDetails,on_delete=models.CASCADE,related_name="dept_details")
  user_details = models.OneToOneField(User,on_delete=models.CASCADE,related_name="deptemps")
  role = models.CharField(max_length=250,blank=True,null=True)


class Complaint(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]

    branch = models.ForeignKey(DeptDetails, on_delete=models.CASCADE, related_name="complaints")
    citizen = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    action_taken = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.branch})"