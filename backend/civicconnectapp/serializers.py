from rest_framework import serializers
from .models import *
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from .utils import generate_dept_email
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.gis.geos import Point
from django.db.models import F
####################################### COMMON PAGES  #######################################


# ------------------- Registration ------------------- #
class RegistrationSerializers(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True} }

    def validate(self, data):
        special_chars = '!#$%^&*()-+_=[]|;.<>?/'

        if not data.get('first_name'):
            raise serializers.ValidationError("Please enter name !!")

        if any(ch in special_chars for ch in data['first_name']):
            raise serializers.ValidationError("Name should not have any special characters !!")

        if not data.get('email'):
            raise serializers.ValidationError("Please enter email !!")

        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("This email already exists")

        return data

    def create(self, validated_data):
        # Create User
        user = User.objects.create(username=validated_data['email'],first_name=validated_data['first_name'],email=validated_data['email'])
        # Hash password
        user.set_password(validated_data['password'])
        user.save()
        # Create UserDetail
        UserDetail.objects.create(user=user)
        return user



# ------------------- Login ------------------- #
class LoginSerializers(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user exists. Please register.")

        # CHECK WHETHER USER IS ACTIVE
        if not user.is_active:
            raise serializers.ValidationError("Your account has been deactivated. Please contact the administrator.")

        # CHECK PASSWORD
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid password.")

        data['user'] = user
        return data

# ------------------- District ------------------- #
class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = '__all__'



####################################### ADMIN MODULE #######################################

# ------------------- ADMIN - View Users ------------------- #
class AdminUserViewSerializers(serializers.ModelSerializer):
    user_profile_id = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'first_name',
            'email',
            'is_active',
            'date_joined',
            'is_staff',
            'user_profile_id',
            'role',
        ]

    def get_user_profile_id(self, obj):
        profile = UserDetail.objects.filter(user=obj).first()
        return profile.id if profile else None

    def get_role(self, obj):
        profile = UserDetail.objects.filter(user=obj).first()
        return profile.role if profile else "user"



# ------------------- ADMIN: Profile ------------------- #
class ProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.first_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    class Meta:
        model = UserDetail
        fields = ['name', 'email', 'phone', 'dob', 'address', 'image', 'role']
        read_only_fields = ['role']  

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if 'first_name' in user_data:
            instance.user.first_name = user_data['first_name']
        if 'email' in user_data:
            instance.user.email = user_data['email']
        instance.user.save()

        return super().update(instance, validated_data)

# -------------------  ADMIN: change password ------------------- #
class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data




# ADMIN DASHBOARD - USER STATISTICS

class AdminUserDashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    inactive_users = serializers.IntegerField()
    new_users_this_month = serializers.IntegerField()
    role_breakdown = serializers.ListField()
    monthly_growth = serializers.ListField()
    recent_users = serializers.ListField()

# -------------------  ADMIN:  department  ------------------- #
class DepartmentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user_profile.user.email",read_only=True)
    user_id = serializers.IntegerField(source="user_profile.user.id",read_only=True)
    role = serializers.CharField(source="user_profile.role",read_only=True)
    class Meta:
        model = Dept
        fields = ["id","user_id","deptname","deptadv","email","role"]


# -------------------  ADMIN: add department  ------------------- #
class AddDepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dept
        fields = ["id","deptname","deptadv"]

    def validate_deptname(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Department name is required.")
        if Dept.objects.filter(deptname__iexact=value).exists():
            raise serializers.ValidationError("This department already exists.")
        return value

    def validate_deptadv(self, value):
        value = value.strip().upper()
        if not value:
            raise serializers.ValidationError("Department abbreviation is required.")
        if Dept.objects.filter(deptadv__iexact=value).exists():
            raise serializers.ValidationError("This abbreviation is already in use.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        deptname = validated_data["deptname"]
        deptadv = validated_data["deptadv"]
        # Generate department email
        email = f"{deptadv.lower()}@civicconnect.com"
        # Make sure generated email is unique
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"deptadv": "This abbreviation already has an account."})
        # Create Django User
        user = User.objects.create_user(username=email,email=email,password=email,first_name=deptname,last_name=deptadv)
        # Create UserDetail
        user_detail = UserDetail.objects.create(user=user,role="dept")
        # Create Department
        department = Dept.objects.create(user_profile=user_detail,deptname=deptname,deptadv=deptadv)
        return department



# -------------------  ADMIN: Branch views ------------------- #
class AdminBranchSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="deptid.deptname",read_only=True)
    department_abbreviation = serializers.CharField(source="deptid.deptadv",read_only=True)

    class Meta:
        model = Branch
        fields = [ "id","branch_name","phone","location","website",
            "urls","district","placename","is_active","created_at","department_name","department_abbreviation" ]


# -------------------  ADMIN: Branch employee views ------------------- #
class AdminBranchEmployeeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user_details.first_name",read_only=True)
    email = serializers.EmailField(source="user_details.email",read_only=True)
    is_active = serializers.BooleanField(source="user_details.is_active",read_only=True)
    branch_name = serializers.CharField(source="branch_details.branch_name",read_only=True)

    class Meta:
        model = BranchEmployees
        fields = [ "id","name","email","dob","is_active","branch_name"]




# -------------------  ADMIN: create department  ------------------- #
class DeptCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dept
        fields = ["id", "deptname", "email", "is_active"]
        read_only_fields = ["email", "is_active"]

    def create(self, validated_data):
        deptname = validated_data.get("deptname")
        return Dept.objects.create(deptname=deptname)






# -------------------  ADMIN: Constituency types  ------------------- #
class ConstituencySerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source="district.dname",read_only=True)
    type_display = serializers.CharField(source="get_type_display",read_only=True)
    representative_id = serializers.SerializerMethodField()
    representative_name = serializers.SerializerMethodField()
    representative_email = serializers.SerializerMethodField()

    class Meta:
        model = Constituency

        fields = [
            "id",
            "name",
            "ward_name_no",
            "type",
            "type_display",
            "district",
            "district_name",
            "representative_id",
            "representative_name",
            "representative_email",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def _get_representative(self, obj):
        representatives = getattr(obj,"_current_representatives",None)

        if representatives is not None:
            return (
                representatives[0]
                if representatives
                else None
            )

        return (obj.constituency.filter(is_current=True).select_related("user_profile__user").first())

    def get_representative_id(self, obj):
        representative = self._get_representative(obj)

        if not representative:
            return None
        return representative.user_profile.user.id

    def get_representative_name(self, obj):
        representative = self._get_representative(obj)

        if not representative:
            return None
        return representative.user_profile.user.first_name

    def get_representative_email(self, obj):
        representative = self._get_representative(obj)

        if not representative:
            return None
        return representative.user_profile.user.email


# -------------------  ADMIN: Constituency types -2 ------------------- #
class ConstituencyTypeChoicesSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


# -------------------  ADMIN: Add Representative ------------------- #
class AddRepresentativeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True)
    generated_email = serializers.EmailField(read_only=True)

    class Meta:
        model = Representative
        fields = ["id", "name", "generated_email", "start_date", "end_date", "constituency"]
        extra_kwargs = {"constituency": {"required": False, "allow_null": True}}

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Representative name is required.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        name = validated_data.pop("name").strip()
        base = "".join(ch.lower() for ch in name if ch.isalnum()) or "representative"
        email = f"{base}@civicconnect.com"
        counter = 1
        while User.objects.filter(username__iexact=email).exists() or User.objects.filter(email__iexact=email).exists():
            email = f"{base}{counter}@civicconnect.com"
            counter += 1

        user = User.objects.create_user(username=email,email=email,password=email,first_name=name,is_active=True)
        profile = UserDetail.objects.create(user=user, role="representative")
        representative = Representative.objects.create(user_profile=profile, **validated_data)
        representative.generated_email = email
        return representative





# -------------------  ADMIN: view Representative  ------------------- #
class RepresentativeSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user_profile.user.first_name",read_only=True)
    user_email = serializers.EmailField(source="user_profile.user.email",read_only=True)
    constituency_name = serializers.CharField(source="constituency.name",read_only=True)
    constituency_ward = serializers.CharField(source="constituency.ward_name_no",read_only=True)
    constituency_type = serializers.CharField(source="constituency.type",read_only=True)
    district_name = serializers.CharField(source="constituency.district.dname",read_only=True)

    class Meta:
        model = Representative
        fields = [
            "id",
            "user_profile",
            "user_name",
            "user_email", 
            "constituency",
            "constituency_name",
            "constituency_ward",
            "constituency_type",
            "district_name",
            "start_date",
            "end_date",
            "is_current",
        ]


# -------------------  ADMIN: Update Representative  ------------------- #
class RepresentativeAdminUpdateSerializer(serializers.ModelSerializer):
    new_user_profile = serializers.PrimaryKeyRelatedField(
        queryset=UserDetail.objects.filter(role="user"),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Representative
        fields = ["new_user_profile", "constituency", "start_date", "end_date", "is_current"]
        read_only_fields = ["is_current"]

    def validate(self, attrs):
        start_date = attrs.get("start_date", self.instance.start_date)
        end_date = attrs.get("end_date", self.instance.end_date)
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        return attrs

    @transaction.atomic
    def update(self, instance, validated_data):
        new_profile = validated_data.pop("new_user_profile", None)
        old_profile = instance.user_profile

        if new_profile and new_profile.pk != old_profile.pk:
            # Deactivate old representative account and demote role.
            old_profile.role = "user"
            old_profile.save(update_fields=["role"])
            old_profile.user.is_active = False
            old_profile.user.save(update_fields=["is_active"])

            # Activate and promote the newly selected account.
            new_profile.role = "representative"
            new_profile.save(update_fields=["role"])
            new_profile.user.is_active = True
            new_profile.user.save(update_fields=["is_active"])
            instance.user_profile = new_profile

        return super().update(instance, validated_data)




####################################### DEPARTMENT MODULE #######################################'
# ------------------- DEPARTMENT: Profile ------------------- #
class DeptProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user_profile.user.first_name",required=False)
    email = serializers.EmailField(source="user_profile.user.email",read_only=True)
    role = serializers.CharField(source="user_profile.role",read_only=True)
    user_id = serializers.IntegerField(source="user_profile.user.id",read_only=True)

    class Meta:
        model = Dept
        fields = [
            "id","user_id","name","email","deptname","deptadv","phone","location",
            "website","urls","is_active","placename","created_at","role"
        ]
        read_only_fields = ["id","user_id","email","role","is_active","created_at"]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user_profile", {})
        user = instance.user_profile.user
        if "first_name" in user_data:
            user.first_name = user_data["first_name"]
            user.save(update_fields=["first_name"])
        return super().update(instance, validated_data)



# ------------------- DEPARTMENT: change password ------------------- #
# DELETE this whole block from serializers.py:
class DeptChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        dept = self.context["dept"]
        if not dept.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def save(self, **kwargs):
        dept = self.context["dept"]
        dept.set_password(self.validated_data["new_password"])
        dept.save()
        return dept

# -------------------  DEPARTMENT: view branches ------------------- #
class DeptBranchSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user_details.user.email", read_only=True)
    user_id = serializers.IntegerField(source="user_details.user.id", read_only=True)
    role = serializers.CharField(source="user_details.role", read_only=True)
    district_name = serializers.CharField(source="district.dname", read_only=True)

    class Meta:
        model = Branch
        fields = [
            "id", "deptid", "user_id", "branch_name", "placename",
            "district", "district_name", "email", "role", "is_active",
        ]


# -------------------  DEPARTMENT: add branches ------------------- #
class DeptAddBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id","branch_name","placename","district"]

    @transaction.atomic
    def create(self, validated_data):
        branch_name = validated_data["branch_name"]
        placename = validated_data.get("placename", "")
        x = branch_name.strip()
        y = placename.strip()
        check = f"{x}{y}"
        email = f"{check.lower()}@civicconnect.com"

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "An account with this generated email already exists."})

        user = User.objects.create_user(username=email, email=email, password=email, first_name=check)
        user_detail = UserDetail.objects.create(user=user, role="branch")

        request = self.context["request"]
        logged_in_user = request.user

        try:
            dept = Dept.objects.get(user_profile__user=logged_in_user)
        except Dept.DoesNotExist:
            raise serializers.ValidationError({"detail": "No department account found for this login."})

        branch = Branch.objects.create(user_details=user_detail,deptid=dept,**validated_data)
        return branch


# -------------------  DEPARTMENT: edit branches ------------------- #
class DeptEditBranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "branch_name", "placename", "district"]
        read_only_fields = ["id"]

    def validate_placename(self, value):
        value = value.strip() if value else value
        if not value:
            raise serializers.ValidationError("Place name is required.")
        return value






####################################### BRANCH MODULE #######################################
# ------------------- BRANCH: Profile ------------------- #
class BranchProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user_details.user.first_name",required=False)
    email = serializers.EmailField(source="user_details.user.email",read_only=True)
    role = serializers.CharField(source="user_details.role",read_only=True)
    user_id = serializers.IntegerField(source="user_details.user.id",read_only=True)
    deptname = serializers.CharField(source="deptid.deptname",read_only=True)
    class Meta:
        model = Branch
        fields = [
            "id","user_id","name","deptname","email","branch_name","phone","location",
            "website","urls","is_active","placename","created_at","role",
        ]
        read_only_fields = ["id","user_id","deptname","branch_name","email","role","is_active","created_at"]

    def update(self, instance, validated_data):
        user_details_data  = validated_data.pop("user_details", {})
        user_data = user_details_data.get("user", {})
        if "first_name" in user_data:
            user = instance.user_details.user
            user.first_name = user_data["first_name"]
            user.save(update_fields=["first_name"])
    
        return super().update(instance, validated_data)



# ------------------- BRANCH: change password ------------------- #
class BranchChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data



# ------------------- BRANCH: add Branch Employee  ------------------- #
class AddBranchEmployeeSerializer(serializers.ModelSerializer):
    fullname = serializers.CharField(write_only=True,required=True)
    branch = serializers.CharField(source="branch_details.branch_name",read_only=True)
    placename = serializers.CharField(source="branch_details.placename",read_only=True)
    emp_name = serializers.CharField(source="user_details.first_name",read_only=True)
    email = serializers.EmailField(source="user_details.email",read_only=True)
    date_joined = serializers.DateTimeField(source="user_details.date_joined",read_only=True)
    account_is_active = serializers.BooleanField(source="user_details.is_active",read_only=True)

    class Meta:
        model = BranchEmployees
        fields = [
            "id",
            "fullname",
            "branch",
            "emp_name",
            "placename",
            "email",
            "dob",
            "designation",
            "is_active",
            "account_is_active",
            "date_joined",
        ]

        read_only_fields = [
            "id",
            "branch",
            "emp_name",
            "placename",
            "email",
            "is_active",
            "account_is_active",
            "date_joined",
        ]

    def validate_fullname(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Employee name is required.")

        return value

    @transaction.atomic
    def create(self, validated_data):
        fullname = validated_data.pop("fullname")
        branch = self.context.get("branch")

        if not branch:
            raise serializers.ValidationError({"branch": "Branch was not found."})

        fullname_part = "".join(character
            for character in fullname.lower()
            if character.isalnum()
        )

        branch_part = "".join(character
            for character in branch.branch_name.lower()
            if character.isalnum()
        )

        place_part = "".join(character
            for character in (branch.placename or "").lower()
            if character.isalnum()
        )

        if not fullname_part:
            raise serializers.ValidationError({"fullname": "Enter a valid employee name."})

        if not branch_part:
            raise serializers.ValidationError({"branch": "Branch name is required."})

        if not place_part:
            raise serializers.ValidationError({"placename": "Branch place name is required."})

        email_name = f"{fullname_part}{branch_part}{place_part}"
        email = f"{email_name}@civicconnect.com"

        counter = 1

        while (User.objects.filter(username=email).exists() or User.objects.filter(email__iexact=email).exists()):
            email = f"{email_name}{counter}@civicconnect.com"
            counter += 1
        password = email
        user = User.objects.create_user(username=email,email=email,password=password,first_name=fullname,is_active=True)

        UserDetail.objects.create(user=user,role="BranchEmployee")
        employee = BranchEmployees.objects.create(branch_details=branch,user_details=user,is_active=True,**validated_data)

        return employee




# ------------------- BRANCH: Update Complaint Status ------------------- #
class ComplaintStatusUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Complaint
        fields = [
            "status",
            "action_taken"
        ]

    def validate_status(self, value):
        allowed_statuses = { choice[0]
            for choice in Complaint.StatusChoices.choices
        }

        if value not in allowed_statuses:
            raise serializers.ValidationError("Invalid complaint status.")

        return value

    def update(self, instance, validated_data):
        old_status = instance.status
        new_status = validated_data.get("status",instance.status)

        instance = super().update(instance,validated_data)

        return instance





####################################### USER MODULE #######################################

# ------------------- USER: Profile  ------------------- #
class UserProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.first_name",required=False)
    email = serializers.EmailField(source="user.email",read_only=True)
    user_id = serializers.IntegerField(source="user.id",read_only=True)
    class Meta:
        model = UserDetail
        fields = [ "id","user_id","name","email","phone","dob","address","image","role",]
        read_only_fields = ["id","user_id","email","role","is_active",]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if "first_name" in user_data:
            instance.user.first_name = user_data["first_name"]
            instance.user.save(update_fields=["first_name"])
        return super().update(instance, validated_data)


# ------------------- USER: Change Password ------------------- #
class UserChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True,validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data






####################################### REPRESENTATIVE MODULE #######################################

# ------------------- REPRESENTATIVE: Profile ------------------- #
class RepresentativeProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user_profile.user.id",read_only=True)
    name = serializers.CharField(source="user_profile.user.first_name",required=False)
    email = serializers.EmailField(source="user_profile.user.email",read_only=True)
    phone = serializers.CharField(source="user_profile.phone",required=False,allow_blank=True)
    dob = serializers.DateField(source="user_profile.dob",required=False,allow_null=True)
    address = serializers.CharField(source="user_profile.address",required=False,allow_blank=True)
    image = serializers.ImageField(source="user_profile.image",required=False,allow_null=True)
    role = serializers.CharField(source="user_profile.role",read_only=True)
    constituency_name = serializers.CharField(source="constituency.name",read_only=True)

    class Meta:
        model = Representative
        fields = [ "id","user_id","name","email","phone","dob","address","image",
            "role","constituency","constituency_name","start_date","end_date","is_current",]

        read_only_fields = ["id","user_id","email","role","constituency_name",]

    def update(self, instance, validated_data):
        user_profile_data = validated_data.pop("user_profile",{})
        user_data = user_profile_data.pop("user",{})
        # Update Django User
        if "first_name" in user_data:
            instance.user_profile.user.first_name = user_data["first_name"]
            instance.user_profile.user.save(update_fields=["first_name"])
        # Update UserDetail
        for field, value in user_profile_data.items():
            setattr(instance.user_profile,field,value)
        instance.user_profile.save()
        # Update Representative
        return super().update(instance,validated_data)



# ------------------- REPRESENTATIVE: Change Password ------------------- #
class RepresentativeChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True,validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


# -------------------  REPRESENTATIVE: Constituency-assign ------------------- #

class RepresentativeConstituencySerializer(serializers.ModelSerializer):
    constituency_name = serializers.CharField(source="constituency.name",read_only=True)
    ward_name_no = serializers.CharField(source="constituency.ward_name_no",read_only=True)
    constituency_type = serializers.CharField(source="constituency.get_type_display",read_only=True)
    district_name = serializers.CharField(source="constituency.district.dname",read_only=True)

    class Meta:
        model = Representative
        fields = [ "id","constituency","constituency_name","ward_name_no","constituency_type","district_name",
            "start_date","end_date","is_current"]

        read_only_fields = [
            "id","constituency","constituency_name","ward_name_no","constituency_type","district_name",
            "start_date","end_date","is_current"]






####################################### BRANCH-EMPLOYEE MODULE #######################################

# ------------------- BRANCH-EMPLOYEE: Profile ------------------- #
class BranchEmployeeProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user_details.id",read_only=True)
    name = serializers.CharField(source="user_details.first_name",required=False)
    email = serializers.EmailField(source="user_details.email",read_only=True)
    branch_name = serializers.CharField(source="branch_details.branch_name",read_only=True)
    department_name = serializers.CharField(source="branch_details.deptid.deptname",read_only=True)
    branch_location = serializers.CharField(source="branch_details.location",read_only=True)

    class Meta:
        model = BranchEmployees
        fields = [ "id","user_id","name","email","dob","branch_name","department_name","branch_location"]

        read_only_fields = ["id","user_id","email","branch_name","department_name","branch_location"]

    def update(self, instance, validated_data):
        user_details_data = validated_data.pop("user_details", {})
        if "first_name" in user_details_data:
            user = instance.user_details
            user.first_name = user_details_data["first_name"]
            user.save(update_fields=["first_name"])
        
        if "dob" in validated_data:
            instance.dob = validated_data["dob"]
            instance.save(update_fields=["dob"])
            
        return instance


# ------------------- BRANCH-EMPLOYEE: Change Password ------------------- #
class BranchEmployeeChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError({'confirm_password': 'New & previous password are same.Please Change '})
        
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data




####################################### LOCATION-BASED LOOKUP (CITIZEN) #######################################

# ------------------- Nearby Branch (public-facing) ------------------- #
class NearbyBranchSerializer(serializers.ModelSerializer):
    district_name = serializers.CharField(source="district.dname", read_only=True)
    department_name = serializers.CharField(source="deptid.deptname", read_only=True)
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [ "id", "branch_name", "department_name", "phone", "location",
            "placename", "district_name", "website", "distance_km"]

    def get_distance_km(self, obj):
        distance = getattr(obj, "distance", None)
        return round(distance.km, 2) if distance is not None else None


# ------------------- Nearby Representative (public-facing) ------------------- #
class NearbyRepresentativeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user_profile.user.first_name", read_only=True)
    phone = serializers.CharField(source="user_profile.phone", read_only=True)
    constituency_name = serializers.CharField(source="constituency.name", read_only=True)
    constituency_type = serializers.CharField(source="constituency.type", read_only=True)
    constituency_type_display = serializers.CharField(source="constituency.get_type_display", read_only=True)
    district_name = serializers.CharField(source="constituency.district.dname", read_only=True)

    class Meta:
        model = Representative
        fields = ["id", "name", "phone", "constituency_name", "constituency_type",
            "constituency_type_display", "district_name"]








####################################### COMPLAINT MODULE #######################################

# ------------------- USER: File Complaint ------------------- #
class ComplaintCreateSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(write_only=True, required=False, allow_null=True)
    longitude = serializers.FloatField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Complaint
        fields = [ "id", "branch", "representative", "title", "description", "location",
            "latitude", "longitude", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter a complaint title.")
        return value

    def validate(self, attrs):
        branch = attrs.get("branch")
        representative = attrs.get("representative")

        if not branch and not representative:
            raise serializers.ValidationError("Select either a branch or a representative to file this complaint against.")
        if branch and representative:
            raise serializers.ValidationError("Choose only one — either a branch or a representative, not both.")
        return attrs

    def create(self, validated_data):
        latitude = validated_data.pop("latitude", None)
        longitude = validated_data.pop("longitude", None)

        request = self.context["request"]
        validated_data["citizen"] = request.user

        if latitude is not None and longitude is not None:
            validated_data["location_point"] = Point(longitude, latitude, srid=4326)

        return Complaint.objects.create(**validated_data)



# ------------------- USER: View Own Complaints ------------------- #
class ComplaintListSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.branch_name",read_only=True)
    representative_name = serializers.CharField(source="representative.user_profile.user.first_name",read_only=True)
    representative_constituency = serializers.CharField(source="representative.constituency.name",read_only=True)
    status_display = serializers.CharField(source="get_status_display",read_only=True)
    priority_display = serializers.CharField(source="get_priority_display",read_only=True)
    citizen_name = serializers.CharField(source="citizen.first_name",read_only=True)
    assigned_employee_name = serializers.CharField(source="assigned_employee.user_details.user.first_name",read_only=True)
    
    class Meta:
        model = Complaint

        fields = [
            "id",
            # citizen
            "citizen",
            "citizen_name",
            # complaint
            "title",
            "description",
            "category",
            # branch
            "branch",
            "branch_name",
            # representative
            "representative",
            "representative_name",
            "representative_constituency",
            # status
            "status",
            "status_display",
            "priority",
            "priority_display",
            # assignment
            "assigned_employee",
            "assigned_employee_name",
            # action
            "action_taken",
            "resolution_notes",
            # location
            "location",
            # timestamps
            "created_at",
            "updated_at",
            "resolved_at",
        ]

        read_only_fields = fields



# ============================================================================
# PHASE 2 SERIALIZERS — append to civicconnectapp/serializers.py
#
# Add this import near the top of serializers.py (next to the other django.db
# import) — it's needed by ComplaintLikeSerializer.create():
#
#     from django.db.models import F
#
# Everything below assumes the existing `from .models import *` and
# `from rest_framework import serializers` are already in the file.
# ============================================================================


####################################### COMPLAINT CATEGORY #######################################

class ComplaintCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintCategory
        fields = ["id", "name", "description", "icon", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


####################################### COMPLAINT TRANSLATION #######################################

class ComplaintTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintTranslation
        fields = ["id", "complaint", "language", "title", "description", "translated_at", "translated_by"]
        read_only_fields = ["id", "translated_at"]


####################################### COMPLAINT ATTACHMENT #######################################

class ComplaintAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.first_name",read_only=True)

    class Meta:
        model = ComplaintAttachment
        fields = [
            "id",
            "complaint",
            "file",
            "file_type",
            "original_filename",
            "file_size",
            "mime_type",
            "description",
            "uploaded_by",
            "uploaded_by_name",
            "uploaded_at",
            "is_verified",
        ]

        read_only_fields = [
            "id",
            "complaint",
            "uploaded_by",
            "uploaded_by_name",
            "uploaded_at",
            "is_verified",
            "original_filename",
            "file_size",
            "mime_type",
        ]

    def validate_file(self, value):
        max_size = 25 * 1024 * 1024  # 25 MB

        if value.size > max_size:
            raise serializers.ValidationError("File must be under 25MB.")
        return value

    def validate_file_type(self, value):
        allowed_types = {
            ComplaintAttachment.FileType.IMAGE,
            ComplaintAttachment.FileType.VIDEO,
            ComplaintAttachment.FileType.AUDIO,
            ComplaintAttachment.FileType.DOCUMENT,
            ComplaintAttachment.FileType.OTHER,
        }

        if value not in allowed_types:
            raise serializers.ValidationError("Invalid attachment type.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        uploaded_file = validated_data["file"]

        validated_data["original_filename"] = uploaded_file.name
        validated_data["file_size"] = uploaded_file.size
        validated_data["mime_type"] = (getattr(uploaded_file, "content_type", None) or "")

        if request and request.user.is_authenticated:
            validated_data["uploaded_by"] = request.user

        return ComplaintAttachment.objects.create(**validated_data)




####################################### COMPLAINT LIKE #######################################

class ComplaintLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintLike
        fields = ["id", "complaint", "user", "created_at"]
        read_only_fields = ["id", "user", "created_at"]

    def validate_complaint(self, value):
        request = self.context["request"]
        if ComplaintLike.objects.filter(complaint=value, user=request.user).exists():
            raise serializers.ValidationError("You have already supported this complaint.")
        return value

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        like = ComplaintLike.objects.create(**validated_data)
        # Keep the denormalized counter on Complaint in sync
        Complaint.objects.filter(pk=like.complaint_id).update(like_count=F("like_count") + 1)
        return like


####################################### COMPLAINT ESCALATION #######################################

class ComplaintEscalationSerializer(serializers.ModelSerializer):
    escalated_by_name = serializers.CharField(source="escalated_by.first_name", read_only=True)
    escalated_to_name = serializers.CharField(source="escalated_to.first_name", read_only=True)
    reason_display = serializers.CharField(source="get_reason_display", read_only=True)

    class Meta:
        model = ComplaintEscalation
        fields = [
            "id", "complaint",
            "escalated_by", "escalated_by_name",
            "escalated_to", "escalated_to_name",
            "reason", "reason_display", "notes",
            "created_at", "resolved_at", "is_resolved",
        ]
        read_only_fields = [
            "id", "escalated_by", "escalated_by_name", "escalated_to_name",
            "reason_display", "created_at", "resolved_at", "is_resolved",
        ]

    def validate_notes(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please describe the reason for escalation.")
        return value

    def create(self, validated_data):
        validated_data["escalated_by"] = self.context["request"].user
        return ComplaintEscalation.objects.create(**validated_data)


####################################### COMPLAINT FEEDBACK #######################################

class ComplaintFeedbackSerializer(serializers.ModelSerializer):
    rating_display = serializers.CharField(source="get_rating_display", read_only=True)

    class Meta:
        model = ComplaintFeedback
        fields = [
            "id", "complaint", "rating", "rating_display",
            "comment", "would_recommend", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "rating_display", "created_at", "updated_at"]

    def validate_complaint(self, value):
        if value.status != Complaint.StatusChoices.RESOLVED:
            raise serializers.ValidationError("Feedback can only be left on resolved complaints.")
        if ComplaintFeedback.objects.filter(complaint=value).exists():
            raise serializers.ValidationError("Feedback has already been submitted for this complaint.")
        return value


####################################### LOCAL BODY REPRESENTATIVE #######################################

class LocalBodyRepresentativeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user_profile.user.first_name", read_only=True)
    email = serializers.EmailField(source="user_profile.user.email", read_only=True)
    phone = serializers.CharField(source="user_profile.phone", read_only=True)
    constituency_name = serializers.CharField(source="constituency.name", read_only=True)
    constituency_type = serializers.CharField(source="constituency.type", read_only=True)
    district_name = serializers.CharField(source="constituency.district.dname", read_only=True)
    designation_display = serializers.CharField(source="get_designation_display", read_only=True)

    class Meta:
        model = LocalBodyRepresentative
        fields = [
            "id", "user_profile", "name", "email", "phone",
            "constituency", "constituency_name", "constituency_type", "district_name",
            "designation", "designation_display","start_date", "end_date", "is_current"
        ]
        read_only_fields = [
            "id", "name", "email", "phone","constituency_name", "constituency_type",
            "district_name", "designation_display"
        ]

    def validate(self, attrs):
        # Only one current president / vice-president per constituency
        constituency = attrs.get("constituency", getattr(self.instance, "constituency", None))
        designation = attrs.get("designation", getattr(self.instance, "designation", None))

        if designation in ("president", "vice_president") and constituency:
            qs = LocalBodyRepresentative.objects.filter(
                constituency=constituency, designation=designation, is_current=True)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    f"This constituency already has a current {designation.replace('_', ' ')}.")
        return attrs


####################################### COMPLAINT DETAIL (nested, read-heavy) #######################################

class ComplaintDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name",read_only=True)
    status_display = serializers.CharField(source="get_status_display",read_only=True)
    priority_display = serializers.CharField(source="get_priority_display",read_only=True)
    citizen_name = serializers.CharField(source="citizen.first_name",read_only=True)
    branch_name = serializers.CharField(source="branch.user_details.user.first_name",read_only=True)
    representative_name = serializers.CharField(source="representative.user_profile.user.first_name",read_only=True)
    assigned_employee_name = serializers.CharField(source="assigned_employee.user_details.user.first_name",read_only=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()
    attachments = ComplaintAttachmentSerializer(many=True,read_only=True)
    responses = serializers.SerializerMethodField()
    translations = ComplaintTranslationSerializer(many=True,read_only=True)
    escalations = ComplaintEscalationSerializer(many=True,read_only=True)
    feedback = ComplaintFeedbackSerializer(read_only=True)
    local_body_representative_name = serializers.CharField(source="local_body_representative.user_profile.user.first_name",
    read_only=True)
    constituency_name = serializers.CharField(source="constituency.name",read_only=True)
    representative_constituency_type = serializers.CharField(source="representative.constituency.get_type_display",
        read_only=True)
    representative_start_date = serializers.DateField(source="representative.start_date",read_only=True)
    representative_end_date = serializers.DateField(source="representative.end_date",read_only=True)
    
    class Meta:
        model = Complaint
        fields = [
            "id", "citizen", "citizen_name", "title", "description",
            "category", "category_name","status", "status_display", "priority", "priority_display",
            "branch", "branch_name","representative", "representative_name",
            "local_body_representative", "local_body_representative_name",
            "assigned_employee", "assigned_employee_name",  
            "constituency", "constituency_name","location", "latitude", "longitude",
            "action_taken", "resolution_notes","audio_file", "voice_language", "original_language",
            "like_count", "view_count", "has_liked","created_at", "updated_at", "resolved_at",
            "attachments", "translations", "escalations", "feedback","representative_constituency_type",
            "representative_start_date","representative_end_date","responses","attachments",
        ]
        read_only_fields = [
            "id", "citizen", "citizen_name", "category_name","status_display", "priority_display",
            "branch_name", "representative_name", "local_body_representative_name", "assigned_employee_name",  
            "constituency_name", "latitude", "longitude","like_count", "view_count", "has_liked",
            "created_at", "updated_at", "resolved_at","attachments", "translations",
            "escalations", "feedback", "responses",
        ]


    def get_responses(self, obj):
        result = []
        
        # REPRESENTATIVE + BRANCH EMPLOYEE RESPONSES
        response_queryset = (obj.responses.select_related(
                "representative",
                "representative__user_profile",
                "representative__user_profile__user",

                "branch_employee",
                "branch_employee__user_details",
                "branch_employee__branch_details",
            ).prefetch_related("attachments").order_by("created_at"))

        # Your ComplaintResponseSerializer is defined later in
        # serializers.py. That is okay here because this method is
        # executed only after the module has fully loaded.
        serialized_responses = ComplaintResponseSerializer(response_queryset,many=True,context=self.context).data

        for item in serialized_responses:
            responder_type = item.get("responder_type")
            if responder_type == "branch_employee":
                authority_type = "Branch Employee"

            elif responder_type == "representative":
                authority_type = "Representative"

            else:
                authority_type = "Authority"

            result.append({
                "id": item["id"],
                "authority_name": item.get("responder_name") or "Authority",
                "authority_type": authority_type,
                "response": item.get("response"),
                "attachments": item.get("attachments", []),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
            })



        # BRANCH RESPONSE
        if obj.branch_id and obj.action_taken:
            result.append({
                "id": f"branch-action-{obj.id}",
                "authority_name": obj.branch.branch_name or "Branch",
                "authority_type": "Branch",
                "response": obj.action_taken,
                "attachments": [],
                "created_at": obj.updated_at,
                "updated_at": obj.updated_at
            })


        # REPRESENTATIVE action_taken
        elif obj.representative_id and obj.action_taken:
            user = (obj.representative.user_profile.user)
            representative_name = (user.get_full_name() or user.first_name or user.username)

            result.append({
                "id": f"representative-action-{obj.id}",
                "authority_name": representative_name,
                "authority_type": "Representative",
                "response": obj.action_taken,
                "attachments": [],
                "created_at": obj.updated_at,
                "updated_at": obj.updated_at,
            })

        # RESOLUTION NOTES
        if obj.resolution_notes:
            if obj.branch_id:
                authority_name = (obj.branch.branch_name or "Branch")
                authority_type = "Branch"

            elif obj.representative_id:
                user = (obj.representative.user_profile.user)
                authority_name = (user.get_full_name() or user.first_name or user.username)
                authority_type = "Representative"

            else:
                authority_name = "Authority"
                authority_type = "Authority"

            result.append({
                "id": f"resolution-{obj.id}",
                "authority_name": authority_name,
                "authority_type": authority_type,
                "response": obj.resolution_notes,
                "attachments": [],
                "created_at": obj.resolved_at or obj.updated_at,
                "updated_at": obj.updated_at
            })

        result.sort(key=lambda item: item.get("created_at") or item.get("updated_at"))
        return result

    def get_latitude(self, obj):
        return obj.location_point.y if obj.location_point else None

    def get_longitude(self, obj):
        return obj.location_point.x if obj.location_point else None

    def get_has_liked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(user=request.user).exists()



####################################### COMPLAINT VOICE STATUS #######################################
class ComplaintVoiceStatusSerializer(serializers.ModelSerializer):
    """Serialize complaint voice processing status for polling"""
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Complaint
        fields = [
            "id",
            "voice_processing_status",
            "status_display",
            "title",
            "description",
            "original_language",
            "audio_file",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "voice_processing_status",
            "status_display",
            "updated_at",
        ]
    
    def get_status_display(self, obj):
        if obj.voice_processing_status:
            return dict(Complaint.VoiceProcessingStatus.choices).get(obj.voice_processing_status)
        return None


    ####################################### TEXT TRANSLATION #######################################
class TranslateTextSerializer(serializers.Serializer):
    text = serializers.CharField()
    source_language = serializers.ChoiceField(choices=[("en", "English"), ("ml", "Malayalam")])
    target_language = serializers.ChoiceField(choices=[("en", "English"), ("ml", "Malayalam")])

    def validate_text(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter text to translate.")
        return value

    def validate(self, attrs):
        if attrs["source_language"] == attrs["target_language"]:
            raise serializers.ValidationError("Source and target language must be different.")
        return attrs





# ------------------- BRANCH: Assign Complaint to Employee ------------------- #
class ComplaintAssignEmployeeSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="assigned_employee.user_details.first_name", read_only=True)

    class Meta:
        model = Complaint
        fields = ["id", "assigned_employee", "employee_name", "status"]
        read_only_fields = ["id", "employee_name"]

    def validate_assigned_employee(self, value):
        branch = self.context.get("branch")
        if value.branch_details_id != branch.id:
            raise serializers.ValidationError("This employee does not belong to your branch.")
        return value

    def update(self, instance, validated_data):
        # Move a still-pending complaint into progress the moment it's handed off
        if validated_data.get("assigned_employee") and instance.status == Complaint.StatusChoices.PENDING:
            instance.status = Complaint.StatusChoices.IN_PROGRESS
        return super().update(instance, validated_data)





#######################################  COMPLAINT RESPONSES #######################################
class ComplaintResponseAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintResponseAttachment
        fields = [
            "id",
            "response",
            "file",
            "file_type",
            "original_filename",
            "file_size",
            "mime_type",
            "uploaded_by",
            "uploaded_at",
        ]

        read_only_fields = [
            "id",
            "response",
            "uploaded_by",
            "uploaded_at",
            "file_size",
            "original_filename",
            "mime_type",
        ]

    def validate_file(self, value):
        max_size = 25 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError("File must be under 25MB.")

        return value

    def create(self, validated_data):
        request = self.context.get("request")
        file_obj = validated_data.get("file")

        if request and request.user.is_authenticated:
            validated_data["uploaded_by"] = request.user

        if file_obj:
            validated_data.setdefault("original_filename",file_obj.name)
            validated_data.setdefault("file_size",file_obj.size)
            validated_data.setdefault("mime_type",getattr(file_obj, "content_type", None))

        return super().create(validated_data)



class ComplaintResponseSerializer(serializers.ModelSerializer):
    representative_name = (serializers.SerializerMethodField())
    representative_id = (serializers.IntegerField(source="representative.id",read_only=True))
    branch_employee_id = (serializers.IntegerField(source="branch_employee.id",read_only=True))
    branch_employee_name = (serializers.SerializerMethodField())
    responder_name = (serializers.SerializerMethodField())
    responder_type = (serializers.SerializerMethodField())
    attachments = (ComplaintResponseAttachmentSerializer(many=True,read_only=True))

    class Meta:
        model = ComplaintResponse

        fields = [
            "id",
            "complaint",
            "representative_id",
            "representative_name",
            "branch_employee_id",
            "branch_employee_name",
            "responder_name",
            "responder_type",
            "response",
            "attachments",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "representative_id",
            "representative_name",
            "branch_employee_id",
            "branch_employee_name",
            "responder_name",
            "responder_type",
            "attachments",
            "created_at",
            "updated_at",
        ]

    def get_representative_name(self,obj):
        if not obj.representative:
            return None
        user = (obj.representative.user_profile.user)

        return (user.get_full_name() or user.first_name or user.username)

    def get_branch_employee_name(self,obj):
        if not obj.branch_employee:
            return None
        user = (obj.branch_employee.user_details)
        return (user.get_full_name() or user.first_name or user.username)

    def get_responder_name(self,obj):
        if obj.branch_employee:
            user = (obj.branch_employee.user_details)
            return (user.get_full_name() or user.first_name or user.username)

        if obj.representative:
            user = (obj.representative.user_profile.user)
            return (user.get_full_name() or user.first_name or user.username)
        return "Unknown responder"

    def get_responder_type(self,obj):

        if obj.branch_employee:
            return "branch_employee"

        if obj.representative:
            return "representative"

        return "unknown"



class RepresentativeComplaintResponseCreateSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = ComplaintResponse
        fields = [
            "response",
            "attachments",
        ]

    def validate_response(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Response cannot be empty."
            )

        return value

    def validate_attachments(self, files):
        max_size = 25 * 1024 * 1024

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }

        for file_obj in files:

            if file_obj.size > max_size:
                raise serializers.ValidationError(
                    f"{file_obj.name} must be under 25MB."
                )

            content_type = (
                getattr(file_obj, "content_type", None)
                or ""
            ).lower()

            if content_type not in allowed_types:
                raise serializers.ValidationError(
                    f"{file_obj.name} is not a supported file type."
                )

        return files
    
    @transaction.atomic
    def create(self, validated_data):
        files = validated_data.pop("attachments", [])

        response = ComplaintResponse.objects.create(**validated_data)

        request = self.context.get("request")
        uploaded_by = (request.user
            if request and request.user.is_authenticated
            else None)

        for file_obj in files:

            content_type = (getattr(file_obj, "content_type", None) or "").lower()

            if content_type.startswith("image/"):
                file_type = ComplaintResponseAttachment.FileType.IMAGE

            elif content_type in {"application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            }:
                file_type = ComplaintResponseAttachment.FileType.DOCUMENT

            else:
                file_type = ComplaintResponseAttachment.FileType.OTHER

            ComplaintResponseAttachment.objects.create(
                response=response,file=file_obj,
                file_type=file_type,original_filename=file_obj.name,
                file_size=file_obj.size,
                mime_type=getattr(file_obj, "content_type", None),uploaded_by=uploaded_by)

        return response



class BranchEmployeeComplaintResponseCreateSerializer(RepresentativeComplaintResponseCreateSerializer):
    """ Branch Employee uses the same response text and attachment validation as Representative. """
    pass