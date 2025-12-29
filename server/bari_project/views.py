from django.http import HttpResponse

def home(request):
    return HttpResponse("Bari Foods API is running!")
