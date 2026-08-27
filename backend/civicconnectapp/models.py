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
    user_profile = models.OneToOneField(UserDetail,on_delete=models.CASCADE,related_name="department",blank=True,null=True)
    deptname = models.CharField(max_length=250,blank=True,null=True)
    deptadv = models.CharField(max_length=250,blank=True,null=True)
    phone = models.CharField(max_length=15,null=True,blank=True)
    location = models.CharField(max_length=255,null=True,blank=True)
    website = models.URLField(max_length=200,null=True,blank=True)
    urls = models.URLField(max_length=200,null=True,blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True,null=True,blank=True)
    placename = models.CharField(max_length=50,blank=True,null=True)
    def __str__(self):
        return f"{self.dept.deptname} - {self.placename}"



class DeptEmployees(models.Model):
    dept_details = models.ForeignKey(Dept,on_delete=models.CASCADE,related_name="deptemployee")
    user_details = models.OneToOneField(User,on_delete=models.CASCADE,related_name="deptemps")
    role = models.CharField(max_length=250,blank=True,null=True)


# class Complaint(models.Model):
#     STATUS_CHOICES = [
#         ('pending', 'Pending'),
#         ('in_progress', 'In Progress'),
#         ('resolved', 'Resolved'),
#     ]

#     branch = models.ForeignKey(DeptDetails, on_delete=models.CASCADE, related_name="complaints")
#     citizen = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints")
#     title = models.CharField(max_length=255)
#     description = models.TextField(blank=True, null=True)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
#     action_taken = models.TextField(blank=True, null=True)
#     location = models.CharField(max_length=255, blank=True, null=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return f"{self.title} ({self.branch})"



class Constituency(models.Model):
    class ConstituencyType(models.TextChoices):
        GRAMA_PANCHAYAT = "GRAMA_PANCHAYAT", "Grama Panchayat"
        BLOCK_PANCHAYAT = "BLOCK_PANCHAYAT", "Block Panchayat"
        DISTRICT_PANCHAYAT = "DISTRICT_PANCHAYAT", "District Panchayat"
        MUNICIPALITY = "MUNICIPALITY", "Municipality"
        CORPORATION = "CORPORATION", "Corporation"
        LEGISLATIVE_ASSEMBLY = "LEGISLATIVE_ASSEMBLY", "Niyama Sabha"
        LOK_SABHA = "LOK_SABHA", "Lok Sabha"

    name = models.CharField(max_length=200)
    ward_name_no = models.CharField(max_length=200,blank=True,null=True)
    type = models.CharField(max_length=30,choices=ConstituencyType.choices)
    district = models.ForeignKey(District,on_delete=models.CASCADE,related_name="constituencies")
    representative = models.OneToOneField(User,on_delete=models.SET_NULL,null=True,blank=True,related_name="represented_constituency")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Representative(models.Model):
    user_profile = models.OneToOneField(UserDetail,on_delete=models.CASCADE,related_name="representative")
    constituency = models.ForeignKey(Constituency,on_delete=models.SET_NULL,related_name="representatives",null=True,blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True)






class Branch(models.Model):
    deptid = models.ForeignKey(Dept,on_delete=models.CASCADE,related_name="Dept",null=True,blank=True)
    user_details = models.OneToOneField(UserDetail,on_delete=models.CASCADE,related_name="branchuser")
    branch_name = models.CharField(max_length=250,blank=True,null=True)
    phone = models.CharField(max_length=15,null=True,blank=True)
    location = models.CharField(max_length=255,null=True,blank=True)
    website = models.URLField(max_length=200,null=True,blank=True)
    urls = models.URLField(max_length=200,null=True,blank=True)
    district = models.ForeignKey(District,on_delete=models.CASCADE,related_name="district",null=True,blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True,null=True,blank=True)
    placename = models.CharField(max_length=50,blank=True,null=True)
    def __str__(self):
        return f"{self.branch_name} - {self.placename}"



