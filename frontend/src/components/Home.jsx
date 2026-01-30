import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css'; // CHANGED from './Home.css'

const Home = () => {
    useEffect(() => {
        // Animation on scroll
        const animateOnScroll = () => {
            const featureCards = document.querySelectorAll('.feature-card');
            const stepCards = document.querySelectorAll('.step-card');
            
            featureCards.forEach(card => {
                const cardPosition = card.getBoundingClientRect().top;
                const screenPosition = window.innerHeight / 1.2;
                
                if(cardPosition < screenPosition) {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }
            });
            
            stepCards.forEach(card => {
                const cardPosition = card.getBoundingClientRect().top;
                const screenPosition = window.innerHeight / 1.2;
                
                if(cardPosition < screenPosition) {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }
            });
        };

        // Set initial state for animation
        const featureCards = document.querySelectorAll('.feature-card');
        const stepCards = document.querySelectorAll('.step-card');
        
        featureCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s, transform 0.5s';
        });
        
        stepCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s, transform 0.5s';
        });

        window.addEventListener('scroll', animateOnScroll);
        animateOnScroll();

        return () => {
            window.removeEventListener('scroll', animateOnScroll);
        };
    }, []);

    return (
        <div className="home-container">
            {/* Hero Section with Image */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1>Welcome to <span>Online Student Out-Pass System</span></h1>
                            <p>Easily manage student out-pass requests online. Our system streamlines the entire process from application to approval.</p>
                            <div className="cta-buttons">
                                <Link to="/student-login" className="btn btn-primary">
                                    <i className="fas fa-user-graduate"></i> Student Login
                                </Link>
                                <Link to="/admin-login" className="btn btn-secondary">
                                    <i className="fas fa-user-shield"></i> Admin Login
                                </Link>
                            </div>
                        </div>
                        <div className="hero-image">
                            <div className="hero-illustration">
                                <div className="illustration-content">
                                    <i className="fas fa-university"></i>
                                    <h3>Out-Pass Management</h3>
                                    <p>Simplified & Digital</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features" id="features">
                <div className="container">
                    <div className="section-title">
                        <h2>Why Choose Our System?</h2>
                        <p>Our platform offers a complete solution for managing student out-pass requests efficiently and securely.</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-laptop"></i>
                            </div>
                            <h3>Easy to Use</h3>
                            <p>Simple, user-friendly interface for quick out-pass submissions.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-bolt"></i>
                            </div>
                            <h3>Fast Approvals</h3>
                            <p>Get your out-pass requests approved quickly & securely.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <h3>Track Requests</h3>
                            <p>Monitor the status of your requests in real-time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="container">
                    <div className="section-title">
                        <h2>How It Works?</h2>
                        <p>A quick and easy process to manage out-pass requests.</p>
                    </div>
                    <div className="steps-container">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <div className="step-icon">
                                <i className="fas fa-sign-in-alt"></i>
                            </div>
                            <h3>Login</h3>
                            <p>Students log in with their credentials.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <div className="step-icon">
                                <i className="fas fa-edit"></i>
                            </div>
                            <h3>Apply Out-Pass</h3>
                            <p>Fill out the online form with required details.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <div className="step-icon">
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <h3>Get Approved</h3>
                            <p>Faculty reviews and approves/rejects requests.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">4</div>
                            <div className="step-icon">
                                <i className="fas fa-door-open"></i>
                            </div>
                            <h3>Go Out</h3>
                            <p>Get a digital out-pass and show it at the gate.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;