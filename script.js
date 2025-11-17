// Launch date: November 22, 2025 at 11:22 AM
const launchDate = new Date('2025-11-22T11:22:00').getTime();

// Get countdown elements
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');

// Email form
const emailForm = document.getElementById('emailForm');
const emailInput = document.getElementById('emailInput');
const formMessage = document.getElementById('formMessage');

// Update countdown every second
function updateCountdown() {
    const now = new Date().getTime();
    const distance = launchDate - now;

    // Time calculations
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Update display
    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');

    // If countdown is finished
    if (distance < 0) {
        clearInterval(countdownInterval);
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        
        // Show launch message and redirect to main website
        const mainMessage = document.querySelector('.main-message');
        if (mainMessage) {
            mainMessage.innerHTML = `
                <h2 class="title">We're Live! 🎉</h2>
                <p class="subtitle">Welcome to TD1 World. Redirecting you now...</p>
            `;
        }
        
        // Redirect to main website after 2 seconds
        setTimeout(() => {
            window.location.href = '/website/index.html';
        }, 2000);
    }
}

// Initial countdown update
updateCountdown();

// Update countdown every second
const countdownInterval = setInterval(updateCountdown, 1000);

// Email form submission
emailForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    // Disable submit button
    const submitBtn = emailForm.querySelector('.notify-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        // Submit to Netlify Forms
        const formData = new FormData(emailForm);
        
        const response = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        });
        
        if (response.ok) {
            // Also store in localStorage as backup
            const subscribers = JSON.parse(localStorage.getItem('td1_subscribers') || '[]');
            if (!subscribers.includes(email)) {
                subscribers.push(email);
                localStorage.setItem('td1_subscribers', JSON.stringify(subscribers));
            }
            
            showMessage('Thank you! We\'ll notify you when we launch.', 'success');
            emailInput.value = '';
        } else {
            throw new Error('Submission failed');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        // Fallback: store in localStorage
        const subscribers = JSON.parse(localStorage.getItem('td1_subscribers') || '[]');
        if (!subscribers.includes(email)) {
            subscribers.push(email);
            localStorage.setItem('td1_subscribers', JSON.stringify(subscribers));
        }
        showMessage('Thank you! We\'ll notify you when we launch.', 'success');
        emailInput.value = '';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
        formMessage.textContent = '';
        formMessage.className = 'form-message';
    }, 5000);
}

// Add smooth animations on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.countdown-container, .notification-section, .launch-details');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

