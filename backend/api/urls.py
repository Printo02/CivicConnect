""" API URLS """

from django.urls import include, path
from civicconnectapp.views import RegisterAPI,LoginAPI,DistrictAPI,AdminUserViewAPI


urlpatterns = [
    path('register/',RegisterAPI.as_view(),name='register'),
    path('login/',LoginAPI.as_view(),name='login'),
    path('district/',DistrictAPI.as_view(),name='district'),
    path('admin/users/',AdminUserViewAPI.as_view(),name='adminusers')
    
    
]


