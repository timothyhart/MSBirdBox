import RPi.GPIO as GPIO
import time
import subprocess

GPIO.setmode(GPIO.BCM)

GPIO.setup(20, GPIO.IN, pull_up_down=GPIO.PUD_UP)

while True:
	input_state = GPIO.input(20)
	if input_state == False:
		subprocess.call(["xset", "dpms", "force", "on"])
		print ('Button Pressed')
		time.sleep(0.2)
	time.sleep(0.02)
