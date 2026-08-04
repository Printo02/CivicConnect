from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class UserDetail(models.Model):
  user = models.OneToOneField(User,on_delete=models.CASCADE,related_name="profile")
  phone = models.IntegerField(blank=True,null=True)
  dob = models.DateField(blank=True,null=True)
  address = models.TextField(max_length=250,blank=True,null=True)
  image = models.ImageField(upload_to= 'profile_imgs/',blank=True,null=True)
  role = models.CharField(max_length=50,default="user",blank=True,null=True)
  
  def __str__(self):
    return self.user.username    

class District(models.Model):
  dname = models.CharField(max_length=50,blank=True,null=True)

class Dept(models.Model):
  deptname = models.CharField(max_length=250,blank=True,null=True)
  location = models.CharField(max_length=250,blank=True,null=True)

class DeptDetails(models.Model):
  dept = models.OneToOneField(Dept,on_delete=models.CASCADE,related_name="depts")
  phone = models.IntegerField(blank=True,null=True)
  email = models.EmailField(max_length=250,blank=True,null=True)


class DeptEmployees(models.Model):
  dept_details = models.ForeignKey(DeptDetails,on_delete=models.CASCADE,related_name="dept_details")
  user_details = models.OneToOneField(User,on_delete=models.CASCADE,related_name="deptemps")
  role = models.CharField(max_length=250,blank=True,null=True)

