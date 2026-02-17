// Funciones utilities del frontend - Proyecto Final
// TODO: Unificar con otros archivos JS

(function() {
    'use strict';

    const CONFIG = {
        carousel: {
            autoplayDelay: 5000,
            animationDuration: 500
        },
        scroll: {
            offset: 70,
            behavior: 'smooth'
        }
    };

    const DOM = {
        select: (selector, context = document) => {
            try {
                return context.querySelector(selector);
            } catch (error) {
                console.warn(`Selector inválido: ${selector}`);
                return null;
            }
        },

        selectAll: (selector, context = document) => {
            try {
                return Array.from(context.querySelectorAll(selector));
            } catch (error) {
                console.warn(` Selector inválido: ${selector}`);
                return [];
            }
        },

        addEvent: (element, event, handler, options = {}) => {
            if (!element || typeof handler !== 'function') return false;
            try {
                element.addEventListener(event, handler, options);
                return true;
            } catch (error) {
                console.warn(` Error agregando evento ${event}:`, error);
                return false;
            }
        },

        addClass: (element, ...classes) => {
            if (!element || !classes.length) return false;
            try {
                element.classList.add(...classes);
                return true;
            } catch (error) {
                return false;
            }
        },

        removeClass: (element, ...classes) => {
            if (!element || !classes.length) return false;
            try {
                element.classList.remove(...classes);
                return true;
            } catch (error) {
                return false;
            }
        }
    };

    const UI = {
        scrollTo: (element, offset = CONFIG.scroll.offset) => {
            if (!element) return false;
            const targetPosition = element.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: CONFIG.scroll.behavior
            });
            return true;
        }
    };
    class SiteManager {
        constructor() {
            this.components = new Map();
            this.isInitialized = false;
        }
        async init() {
            if (this.isInitialized) return;

            try {
                await this.initializeComponents();
                this.isInitialized = true;
                console.log(' SiteManager inicializado correctamente');
            } catch (err) {
                console.error(' Error inicializando SiteManager:', err);
            }
        }

        async initializeComponents() {
            const components = [
                { name: 'navigation', init: () => this.initNavigation() },
                { name: 'carousel', init: () => this.initCarousel() },
                { name: 'animations', init: () => this.initAnimations() },
                { name: 'forms', init: () => this.initFormValidation() },
                { name: 'mobile', init: () => this.initMobileMenu() },
                { name: 'contact', init: () => this.initContactEffects() }
            ];

            for (const component of components) {
                try {
                    await component.init();
                    this.components.set(component.name, true);
                    console.log(` ${component.name} inicializado`);
                } catch (err) {
                    console.warn(` Error en componente ${component.name}:`, err);
                }
            }
        }
        initNavigation() {
            const navLinks = DOM.selectAll('.nav-btn');
            
            navLinks.forEach(link => {
                DOM.addEvent(link, 'click', this.handleNavigationClick.bind(this));
            });
        }

        handleNavigationClick(e) {
            const href = e.target.getAttribute('href');
            
            if (href?.startsWith('#')) {
                e.preventDefault();
                this.scrollToSection(href.substring(1));
            }
        }

        scrollToSection(targetId) {
            const targetElement = DOM.select(`#${targetId}`);
            if (targetElement) {
                UI.scrollTo(targetElement, 70);
            }
        }

        initCarousel() {
            const carousel = DOM.select('.carousel-wrapper');
            if (!carousel) return;

            const carouselManager = new CarouselManager(carousel);
            carouselManager.init();
        }

        initAnimations() {
            const animationManager = new AnimationManager();
            animationManager.init();
        }

        initFormValidation() {
            const formManager = new FormManager();
            formManager.init();
        }

        initMobileMenu() {
            const mobileManager = new MobileMenuManager();
            mobileManager.init();
        }

        initContactEffects() {
            const contactManager = new ContactEffectsManager();
            contactManager.init();
        }
    }


    class CarouselManager {
        constructor(carousel) {
            this.carousel = carousel;
            this.track = carousel.querySelector('.carousel-track');
            this.slides = carousel.querySelectorAll('.carousel-slide');
            this.prevBtn = carousel.querySelector('.carousel-prev');
            this.nextBtn = carousel.querySelector('.carousel-next');
            this.indicators = carousel.querySelector('.carousel-indicators');
            this.currentSlide = 0;
            this.isAnimating = false;
            this.autoplayInterval = null;
            this.autoplayDelay = CONFIG.carousel.autoplayDelay;
        }

        init() {
            if (!this.track || !this.slides.length) return;

            this.createIndicators();
            this.setupEventListeners();
            this.setupTouchEvents();
            this.setupKeyboardEvents();
            this.preloadImages();
            this.startAutoplay();
        }

        createIndicators() {
            if (!this.indicators) return;

            this.indicators.innerHTML = '';
            
            for (let i = 0; i < this.slides.length; i++) {
                const indicator = document.createElement('div');
                indicator.className = 'carousel-indicator';
                if (i === 0) indicator.classList.add('active');
                
                DOM.addEvent(indicator, 'click', () => {
                    if (this.currentSlide !== i) {
                        this.goToSlide(i);
                        this.resetAutoplay();
                    }
                });
                
                this.indicators.appendChild(indicator);
            }
        }

        setupEventListeners() {
            if (this.prevBtn) {
                DOM.addEvent(this.prevBtn, 'click', () => {
                    this.prevSlide();
                    this.resetAutoplay();
                });
            }

            if (this.nextBtn) {
                DOM.addEvent(this.nextBtn, 'click', () => {
                    this.nextSlide();
                    this.resetAutoplay();
                });
            }

            DOM.addEvent(this.carousel, 'mouseenter', () => {
                this.pauseAutoplay();
            });

            DOM.addEvent(this.carousel, 'mouseleave', () => {
                this.startAutoplay();
            });
        }

        setupTouchEvents() {
            let touchStartX = 0;
            let touchEndX = 0;

            DOM.addEvent(this.carousel, 'touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            DOM.addEvent(this.carousel, 'touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(touchStartX, touchEndX);
            }, { passive: true });
        }

        setupKeyboardEvents() {
            DOM.addEvent(document, 'keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    this.prevSlide();
                    this.resetAutoplay();
                } else if (e.key === 'ArrowRight') {
                    this.nextSlide();
                    this.resetAutoplay();
                }
            });
        }

        handleSwipe(startX, endX) {
            const minSwipeDistance = 50;
            const swipeDistance = startX - endX;

            if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
                this.resetAutoplay();
            }
        }

        goToSlide(index) {
            if (this.isAnimating) return;

            this.isAnimating = true;
            this.currentSlide = index;
            
            const translateX = -this.currentSlide * 100;
            this.track.style.transform = `translateX(${translateX}%)`;
            
            this.updateIndicators();
            
            setTimeout(() => {
                this.isAnimating = false;
            }, CONFIG.carousel.animationDuration);
        }

        nextSlide() {
            const nextIndex = (this.currentSlide + 1) % this.slides.length;
            this.goToSlide(nextIndex);
        }

        prevSlide() {
            const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
            this.goToSlide(prevIndex);
        }

        updateIndicators() {
            if (!this.indicators) return;

            const indicators = this.indicators.querySelectorAll('.carousel-indicator');
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === this.currentSlide);
            });
        }

        startAutoplay() {
            this.pauseAutoplay();
            this.autoplayInterval = setInterval(() => {
                this.nextSlide();
            }, this.autoplayDelay);
        }

        pauseAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
                this.autoplayInterval = null;
            }
        }

        resetAutoplay() {
            this.startAutoplay();
        }

        preloadImages() {
            const images = this.carousel.querySelectorAll('img');
            const loadPromises = Array.from(images)
                .filter(img => !img.complete)
                .map(img => new Promise(resolve => {
                    img.onload = img.onerror = resolve;
                }));

            Promise.all(loadPromises).then(() => {
                this.goToSlide(0);
            });
        }
    }
    class AnimationManager {
        constructor() {
            this.observer = null;
            this.observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.15
            };
        }

        init() {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                this.disableAnimations();
                return;
            }

            this.setupIntersectionObserver();
            this.observeElements();
            this.setupTechnologyEffects();
        }

        disableAnimations() {
            const elements = DOM.selectAll('.animate-entry, .technology-item, .portfolio-item');
            elements.forEach(el => {
                el.style.opacity = '1';
                el.style.animation = 'none';
                el.style.transition = 'none';
                el.style.transform = 'none';
            });
        }

        setupIntersectionObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateElement(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, this.observerOptions);
        }

        observeElements() {
            const elements = DOM.selectAll('.animate-entry');
            elements.forEach(element => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                this.observer.observe(element);
            });
        }

        animateElement(element) {
            const delay = Array.from(DOM.selectAll('.animate-entry')).indexOf(element) * 150;
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, delay);

            if (element.classList.contains('technologies-section')) {
                this.animateTechnologyItems();
            } else if (element.classList.contains('portfolio-section')) {
                this.animatePortfolioItems();
            }
        }

        animateTechnologyItems() {
            const items = DOM.selectAll('.technology-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 200);
            });
        }

        animatePortfolioItems() {
            const items = DOM.selectAll('.portfolio-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0) scale(1)';
                }, index * 150);
            });
        }

        setupTechnologyEffects() {
            const technologyItems = DOM.selectAll('.technology-item');
            
            technologyItems.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(40px)';
                item.style.transition = 'opacity 0.7s ease-out, transform 0.7s ease-out';
                DOM.addEvent(item, 'mousemove', (e) => {
                    const { left, top, width, height } = item.getBoundingClientRect();
                    const x = (e.clientX - left) / width - 0.5;
                    const y = (e.clientY - top) / height - 0.5;
                    
                    item.style.transform = `translateY(-10px) perspective(1000px) rotateX(${y * 5}deg) rotateY(${x * -5}deg)`;
                    
                    const img = item.querySelector('img');
                    if (img) {
                        img.style.transform = `scale(1.05) translateX(${x * 10}px) translateY(${y * 10}px)`;
                    }
                });

                DOM.addEvent(item, 'mouseleave', () => {
                    item.style.transform = 'translateY(-10px)';
                    const img = item.querySelector('img');
                    if (img) {
                        img.style.transform = 'scale(1.05)';
                    }
                });
            });
        }
    }
    class FormManager {
        constructor() {
        }

        init() {
            this.initContactForm();
            this.initPasswordToggle();
        }

        initContactForm() {
            const form = DOM.select('#contactForm');
            if (!form) return;

            const nameInput = form.querySelector('#name');
            const emailInput = form.querySelector('#email');
            const messageInput = form.querySelector('#message');
            const formStatus = form.querySelector('.form-status');
            this.setupFieldValidation(nameInput, {
                valueMissing: 'Por favor, introduce tu nombre.',
                patternMismatch: 'El nombre solo debe contener letras.',
                tooShort: 'El nombre debe tener al menos 2 caracteres.'
            });

            this.setupFieldValidation(emailInput, {
                valueMissing: 'Por favor, introduce tu correo electrónico.',
                typeMismatch: 'Por favor, introduce una dirección de correo válida.',
                patternMismatch: 'El formato del correo no es válido.'
            });

            this.setupFieldValidation(messageInput, {
                valueMissing: 'Por favor, introduce tu mensaje.',
                tooShort: 'El mensaje debe tener al menos 10 caracteres.',
                tooLong: 'El mensaje no puede exceder los 500 caracteres.'
            });

            DOM.addEvent(form, 'submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(form, formStatus);
            });
        }

        setupFieldValidation(field, errorMessages) {
            if (!field) return;

            const errorElement = DOM.select(`#${field.id}Error`);
            
            DOM.addEvent(field, 'blur', () => {
                this.validateField(field, errorElement, errorMessages);
            });

            let typingTimer;
            DOM.addEvent(field, 'input', () => {
                clearTimeout(typingTimer);
                
                if (field.classList.contains('invalid') || field.classList.contains('valid')) {
                    typingTimer = setTimeout(() => {
                        this.validateField(field, errorElement, errorMessages);
                    }, 500);
                }
            });
        }

        validateField(field, errorElement, customMessages = {}) {
            if (!field) return true;

            const isValid = field.checkValidity();
            
            field.classList.toggle('valid', isValid);
            field.classList.toggle('invalid', !isValid);

            if (!isValid && errorElement) {
                let errorMessage = this.getErrorMessage(field, customMessages);
                errorElement.textContent = errorMessage;
                errorElement.classList.add('visible');
            } else if (errorElement) {
                errorElement.textContent = '';
                errorElement.classList.remove('visible');
            }

            return isValid;
        }

        getErrorMessage(field, customMessages) {
            const validity = field.validity;
            
            if (validity.valueMissing) return customMessages.valueMissing || 'Este campo es obligatorio.';
            if (validity.typeMismatch) return customMessages.typeMismatch || 'El formato no es válido.';
            if (validity.patternMismatch) return customMessages.patternMismatch || 'El formato no es válido.';
            if (validity.tooShort) return customMessages.tooShort || `Mínimo ${field.minLength} caracteres.`;
            if (validity.tooLong) return customMessages.tooLong || `Máximo ${field.maxLength} caracteres.`;
            if (validity.rangeUnderflow) return customMessages.rangeUnderflow || `Valor mínimo: ${field.min}.`;
            if (validity.rangeOverflow) return customMessages.rangeOverflow || `Valor máximo: ${field.max}.`;
            
            return 'El valor no es válido.';
        }

        handleFormSubmit(form, formStatus) {
            const nameInput = form.querySelector('#name');
            const emailInput = form.querySelector('#email');
            const messageInput = form.querySelector('#message');
            const submitBtn = form.querySelector('.submit-btn');

            const isValid = [nameInput, emailInput, messageInput].every(input => 
                this.validateField(input, DOM.select(`#${input.id}Error`))
            );

            if (!isValid) {
                const firstInvalid = form.querySelector('.invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            setTimeout(() => {
                formStatus.textContent = '¡Gracias! Tu mensaje ha sido enviado correctamente.';
                formStatus.className = 'form-status success';
                
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                
                form.reset();

                form.querySelectorAll('.error-message').forEach(el => {
                    el.textContent = '';
                    el.classList.remove('visible');
                });
                
                form.querySelectorAll('input, textarea').forEach(el => {
                    el.classList.remove('valid', 'invalid');
                });
                
                setTimeout(() => {
                    formStatus.classList.remove('success');
                }, 5000);
            }, 1000);
        }

        initPasswordToggle() {
            const toggles = DOM.selectAll('.password-toggle input[type="checkbox"]');
            
            toggles.forEach(toggle => {
                DOM.addEvent(toggle, 'change', () => {
                    const passwordField = toggle.closest('.form-group').querySelector('input[type="password"], input[type="text"]');
                    
                    if (passwordField) {
                        passwordField.type = toggle.checked ? 'text' : 'password';
                    }
                });
            });
        }
    }
        class MobileMenuManager {
        init() {
            const toggle = DOM.select('#mobileMenuToggle');
            const nav = DOM.select('.main-nav');
            
            if (!toggle || !nav) return;

            DOM.addEvent(toggle, 'click', () => {
                const isOpen = nav.classList.contains('open');
                
                toggle.classList.toggle('active');
                nav.classList.toggle('open');
                
                toggle.setAttribute('aria-expanded', (!isOpen).toString());
                toggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
            });

            const navLinks = nav.querySelectorAll('a');
            navLinks.forEach(link => {
                DOM.addEvent(link, 'click', () => {
                    if (window.innerWidth <= 768) {
                        toggle.classList.remove('active');
                        nav.classList.remove('open');
                        toggle.setAttribute('aria-expanded', 'false');
                        toggle.setAttribute('aria-label', 'Abrir menú');
                    }
                });
            });

            toggle.setAttribute('aria-expanded', 'false');
        }
    }
    class ContactEffectsManager {
        init() {
            const contactCard = DOM.select('.contact-card');
            const contactForm = DOM.select('#contactForm');
            
            if (!contactCard || !contactForm) return;

            this.setupCardEffects(contactCard);
        }

        setupCardEffects(card) {
            DOM.addEvent(card, 'mousemove', (e) => {
                if (window.innerWidth < 768) return;

                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const maxRotation = 5;
                const rotateY = maxRotation * (x - centerX) / centerX;
                const rotateX = maxRotation * (centerY - y) / centerY;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            DOM.addEvent(card, 'mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            });
        }
    }

    if (document.readyState === 'loading') {
        DOM.addEvent(document, 'DOMContentLoaded', () => {
            const siteManager = new SiteManager();
            siteManager.init();
        });
    } else {
        const siteManager = new SiteManager();
        siteManager.init();
    }

})();