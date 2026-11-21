document.addEventListener("DOMContentLoaded", function () {
    if (window.AOS) AOS.init({ duration: 1500, once: true });

    // Toast notification after successful form submission
    const toastType = localStorage.getItem('toast');
    if (toastType === 'success') {
        toastr.success('Your appointment request has been sent successfully!');
    } else if (toastType === 'error') {
        toastr.error('Message could not be sent. Please try again.');
    }
    localStorage.removeItem('toast');
});

// Form Validation
const form = document.getElementById('appointmentForm');
const submitBtn = document.getElementById('appointment11'); // changed the id to appointment11
const spinner = document.getElementById('spinner');

form.addEventListener('submit', function(e) {
    e.preventDefault();

    let valid = true;

    // Clear previous errors
    document.querySelectorAll('.error').forEach(function(el) {
        el.textContent = '';
    });

    // Name validation
    const name = document.getElementById('name').value;
    if (name.trim() === '') {
        document.getElementById('nameError').textContent = 'Name is required.';
        valid = false;
    }

    // Email validation
    const email = document.getElementById('email').value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address.';
        valid = false;
    }

    // Phone validation
    const phone = document.getElementById('phone').value;
    const phoneRegex = /^07\d{9}$/;
    if (!phoneRegex.test(phone)) {
        document.getElementById('phoneError').textContent = 'Please enter a valid phone number.';
        valid = false;
    }

    // Date validation
    const date = document.getElementById('date').value;
    if (date === '') {
        document.getElementById('dateError').textContent = 'Date is required.';
        valid = false;
    }

    // Time validation
    const time = document.getElementById('time').value;
    if (time === '') {
        document.getElementById('timeError').textContent = 'Time is required.';
        valid = false;
    }

    // If form is valid, disable the submit button and show success message
    if (valid) {
        submitBtn.disabled = true;  // Disable the submit button
        submitBtn.textContent = 'Submitting...';  // Change button text
        spinner.style.display = 'inline-block';  // Show spinner
        localStorage.setItem('toast', 'success');  // Set success message to be shown
        form.submit();  // Submit the form
    }
});