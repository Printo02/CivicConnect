from django.db import models
from django.contrib.auth.models import User
from django.contrib.gis.db import models as gis_models
from django.utils import timezone

class UserDetail(models.Model):
    user = models.OneToOneField(User,on_delete=models.CASCADE,related_name="profile")
    phone = models.CharField(max_length=10,blank=True,null=True)
    dob = models.DateField(blank=True,null=True)
    address = models.TextField(max_length=250,blank=True,null=True)
    image = models.ImageField(upload_to= 'profile_imgs/',blank=True,null=True)
    role = models.CharField(max_length=50,default="user",blank=True,null=True)
    preferred_language = models.CharField(max_length=10,
        choices=[('en', 'English'), ('ml', 'Malayalam')],
        default='en')

    def __str__(self):
        return self.user.username    


class District(models.Model):
    dname = models.CharField(max_length=50,blank=True,null=True)
    
    def __str__(self):
        return self.dname

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
        return f"{self.deptname} - {self.placename}"


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
    district = models.ForeignKey(District,on_delete=models.CASCADE,related_name="constituencies",null=True,blank=True)
    boundary = gis_models.MultiPolygonField(srid=4326, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [ models.Index(fields=['type', 'district']),
            models.Index(fields=['name'])]

    def __str__(self):
        return f"{self.name} ({self.type})"


class Representative(models.Model):
    user_profile = models.OneToOneField(UserDetail,on_delete=models.CASCADE,related_name="representative")
    constituency = models.ForeignKey(Constituency,on_delete=models.SET_NULL,related_name="constituency",null=True,blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user_profile.user.get_full_name()} - {self.constituency}"





class LocalBodyConstituency(models.Model):
    local_body = models.ForeignKey(Constituency,on_delete=models.CASCADE,related_name="wards")
    ward_name = models.CharField(max_length=200)
    ward_number = models.CharField(max_length=50, blank=True, null=True)
    boundary = gis_models.MultiPolygonField(srid=4326,blank=True,null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        indexes = [
            models.Index(fields=["local_body", "ward_number"]),
            models.Index(fields=["ward_name"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["local_body", "ward_number"],
                name="unique_ward_per_local_body"
            )
        ]

    def __str__(self):
        return f"{self.local_body.name} - Ward {self.ward_number}: {self.ward_name}"
    


class LocalBodyRepresentative(models.Model):
    user_profile = models.OneToOneField(UserDetail,on_delete=models.CASCADE,related_name="local_body_representative",null=True, blank=True)
    ward = models.ForeignKey(LocalBodyConstituency,on_delete=models.CASCADE,related_name="representatives",null=True, blank=True)
    designation = models.CharField(max_length=100,choices=[('ward_member', 'Ward Member'),
            ('ward_member_open', 'Ward Member (Open)'),('ward_member_reserved', 'Ward Member (Reserved)'),
            ('president', 'President/Chairperson'),('vice_president', 'Vice President/Vice Chairperson'),
        ],default='ward_member',null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True,null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True,null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True,null=True, blank=True)

    class Meta:
        unique_together = ('user_profile', 'ward', 'designation')

    def __str__(self):
        return (f"{self.user_profile.user.get_full_name()} - "
            f"{self.ward.local_body.name} - Ward {self.ward.ward_number}")




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
    location_point = gis_models.PointField(srid=4326, blank=True, null=True)
    def __str__(self):
        return f"{self.branch_name} - {self.placename}"



class BranchEmployees(models.Model):
    branch_details = models.ForeignKey(Branch,on_delete=models.CASCADE,related_name="branchdetails")
    user_details = models.OneToOneField(User,on_delete=models.CASCADE,related_name="branchemps")
    dob= models.DateField(blank=True,null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    is_active= models.BooleanField(blank=True, null=True)

    def __str__(self):
        return f"{self.user_details.get_full_name()} - {self.branch_details.branch_name}"



class ComplaintCategory(models.Model):
    """ Categories for complaints (e.g., Road, Water Supply, Electricity, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)  # Font Awesome class or emoji
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Complaint Categories"

    def __str__(self):
        return self.name




class Complaint(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"
        REJECTED = "rejected", "Rejected"

    class PriorityChoices(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class VoiceProcessingStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"


    # Core fields
    citizen = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    # Category
    category = models.ForeignKey(ComplaintCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints")
    # Status and priority
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    priority = models.CharField(max_length=20, choices=PriorityChoices.choices, default=PriorityChoices.MEDIUM)
    # Assignment fields
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="complaints", null=True, blank=True)
    representative = models.ForeignKey(Representative, on_delete=models.CASCADE, related_name="complaints", null=True,blank=True)
    local_body_representative = models.ForeignKey(LocalBodyRepresentative, on_delete=models.SET_NULL, null=True, blank=True,related_name="complaints")
    assigned_employee = models.ForeignKey(BranchEmployees, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="assigned_complaints")
    # Constituency (auto-linked based on location_point)
    constituency = models.ForeignKey(Constituency, on_delete=models.SET_NULL, null=True, blank=True, related_name="complaints")
    # Location fields
    location = models.CharField(max_length=255, blank=True, null=True)
    location_point = gis_models.PointField(srid=4326, blank=True, null=True)
    # Response tracking
    action_taken = models.TextField(blank=True, null=True)
    resolution_notes = models.TextField(blank=True, null=True)
    # Voice/Audio original (before transcription)
    audio_file = models.FileField(upload_to='complaint_audio/', blank=True, null=True)
    voice_language = models.CharField(max_length=10,choices=[('en', 'English'), ('ml', 'Malayalam')],
        default='en',blank=True,null=True)
    voice_processing_status = models.CharField(max_length=20,choices=VoiceProcessingStatus.choices,
        default=None,blank=True,null=True,help_text="Status of voice transcription/translation processing")
    # Translation fields
    original_language = models.CharField(max_length=10,choices=[('en', 'English'), ('ml', 'Malayalam')],default='en')
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    # Support/Engagement
    like_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['citizen', 'created_at']),
            models.Index(fields=['constituency']),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"

    def save(self, *args, **kwargs):
        # Auto-update resolved_at when status changes to RESOLVED
        if self.status == self.StatusChoices.RESOLVED and not self.resolved_at:
            self.resolved_at = timezone.now()
        super().save(*args, **kwargs)




class ComplaintResponse(models.Model):
    complaint = models.ForeignKey(Complaint,on_delete=models.CASCADE,related_name="responses")
    representative = models.ForeignKey(Representative,on_delete=models.SET_NULL,null=True,blank=True,related_name="complaint_responses")
    branch_employee = models.ForeignKey(BranchEmployees,on_delete=models.SET_NULL,null=True,
        blank=True,related_name="complaint_responses")
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["complaint","-created_at"])
        ]

    def __str__(self):
        responder_name = "Unknown responder"

        if self.representative:
            user = (self.representative.user_profile.user)
            responder_name = (user.get_full_name() or user.first_name or user.username)

        elif self.branch_employee:
            user = (self.branch_employee.user_details)
            responder_name = (user.get_full_name() or user.first_name or user.username)

        return (f"Response for Complaint "
            f"#{self.complaint_id} "
            f"by {responder_name}")





class ComplaintResponseAttachment(models.Model):
    """
    Files uploaded as part of a representative's response
    to a complaint.
    """

    class FileType(models.TextChoices):
        IMAGE = "image", "Image"
        DOCUMENT = "document", "Document"
        OTHER = "other", "Other"

    response = models.ForeignKey(ComplaintResponse,on_delete=models.CASCADE,related_name="attachments")
    file = models.FileField(upload_to="complaint_response_attachments/")
    file_type = models.CharField(max_length=20,choices=FileType.choices,default=FileType.OTHER)
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=100,blank=True,null=True)
    uploaded_by = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True,related_name="complaint_response_attachments")

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.response.complaint_id} - {self.original_filename}"



class ComplaintTranslation(models.Model):
    """ Store translations of complaint title and description in different languages. """
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="translations")
    language = models.CharField(max_length=10,choices=[('en', 'English'), ('ml', 'Malayalam')])
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    translated_at = models.DateTimeField(auto_now_add=True)
    translated_by = models.CharField(max_length=50, default='auto')  # 'auto' or service name

    class Meta:
        unique_together = ('complaint', 'language')

    def __str__(self):
        return f"{self.complaint.id} - {self.language}"


class ComplaintLike(models.Model):
    """ Track user support/likes for complaints. """
    complaint = models.ForeignKey(Complaint,on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="complaint_likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('complaint', 'user')

    def __str__(self):
        return f"{self.user.username} liked {self.complaint.id}"


class ComplaintEscalation(models.Model):
    """ Track escalations of complaints to higher authorities."""
    class EscalationReason(models.TextChoices):
        DELAYED = 'delayed', 'Delayed Response'
        UNSATISFACTORY = 'unsatisfactory', 'Unsatisfactory Action'
        REASSIGNMENT = 'reassignment', 'Reassignment Needed'
        URGENCY = 'urgency', 'High Urgency'
        OTHER = 'other', 'Other'

    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="escalations")
    escalated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="escalations_initiated")
    escalated_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="escalations_received")
    reason = models.CharField(max_length=50, choices=EscalationReason.choices)
    notes = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"Escalation of {self.complaint.id} - {self.reason}"


class ComplaintFeedback(models.Model):
    """ Track citizen feedback/rating after resolution. """
    class RatingChoices(models.IntegerChoices):
        POOR = 1, 'Poor'
        FAIR = 2, 'Fair'
        GOOD = 3, 'Good'
        VERY_GOOD = 4, 'Very Good'
        EXCELLENT = 5, 'Excellent'

    complaint = models.OneToOneField(Complaint, on_delete=models.CASCADE, related_name="feedback")
    rating = models.IntegerField(choices=RatingChoices.choices)
    comment = models.TextField(blank=True, null=True)
    would_recommend = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Feedback for {self.complaint.id} - Rating: {self.rating}/5"


class ComplaintAttachment(models.Model):
    """ File attachments for complaints (images, videos, documents, audio). """
    class FileType(models.TextChoices):
        IMAGE = 'image', 'Image'
        VIDEO = 'video', 'Video'
        AUDIO = 'audio', 'Audio'
        DOCUMENT = 'document', 'Document'
        OTHER = 'other', 'Other'

    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to='complaint_attachments/')
    file_type = models.CharField(max_length=20, choices=FileType.choices)
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()  # in bytes
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.complaint.id} - {self.original_filename}"
