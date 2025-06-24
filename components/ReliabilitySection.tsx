

import React, { useState, useEffect } from 'react';
import { Testimonial } from '../types';
import { defaultTestimonialsData } from '../data/testimonialsData'; // Import default data

const reasonsData = [
  { 
    iconClass: 'fas fa-thumbs-up', // Using FontAwesome icon class
    title: 'お客様満足度', 
    value: '98.8%', 
    description: '継続的なサポートによる高い満足度を実現',
    animationDelay: '0s'
  },
  { 
    iconClass: 'fas fa-users', 
    title: '提携FP数', 
    value: '1,500+', 
    description: '全国の優秀な専門家ネットワーク',
    animationDelay: '0.5s'
  },
  { 
    iconClass: 'fas fa-trophy', 
    title: '相談実績', // Changed from No.1獲得 for more general appeal
    value: '2,500+', 
    description: '豊富な経験に基づく最適なご提案',
    animationDelay: '1s'
  },
];

const ReliabilitySection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonialsData);

  useEffect(() => {
    const customTestimonialsString = localStorage.getItem('customTestimonials');
    if (customTestimonialsString) {
      try {
        const customTestimonials = JSON.parse(customTestimonialsString);
        if (Array.isArray(customTestimonials) && customTestimonials.length > 0) {
          if (customTestimonials.every(t => typeof t.id === 'string' && typeof t.nameAndRole === 'string' && typeof t.text === 'string')) {
            setTestimonials(customTestimonials);
          } else {
            console.warn("Custom testimonials data from localStorage is malformed. Using default.");
            setTestimonials(defaultTestimonialsData);
          }
        } else if (Array.isArray(customTestimonials) && customTestimonials.length === 0) {
            setTestimonials([]); 
        } else {
             console.warn("Custom testimonials data from localStorage is not an array or is empty. Using default.");
             setTestimonials(defaultTestimonialsData);
        }
      } catch (e) {
        console.error("Error parsing custom testimonials from localStorage. Using default testimonials.", e);
        setTestimonials(defaultTestimonialsData);
      }
    } else {
      setTestimonials(defaultTestimonialsData);
    }
  }, []);


  return (
    <section id="reliability-section" className="py-20 px-4 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h3 className="heading-display text-4xl md:text-5xl mb-6">
            選ばれる理由があります
          </h3>
          <p className="text-xl text-luxury max-w-2xl mx-auto">
            多くのお客様から信頼をいただいている、確かな実績をご紹介します
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {reasonsData.map(reason => (
            <div key={reason.title} className="stats-card" style={{ animationDelay: reason.animationDelay }}>
              <div className="text-4xl mb-4" style={{ color: 'var(--accent-gold)'}} aria-hidden="true">
                <i className={reason.iconClass}></i>
              </div>
              <div className="stats-number">{reason.value}</div>
              <h4 className="text-xl font-semibold mb-2" style={{ color: 'var(--primary-navy)'}}>{reason.title}</h4>
              <p className="text-luxury">{reason.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mb-16">
          <h4 className="heading-primary text-3xl text-center mb-12">お客様の声</h4>
          {testimonials.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map(testimonial => (
                <div key={testimonial.id} className="testimonial-card">
                  <div className="flex items-center mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center mr-4 text-xl"
                      style={{ background: 'var(--neutral-200)', color: 'var(--accent-gold)'}}
                      aria-hidden="true"
                    >
                      {/* Using FontAwesome icon based on avatarEmoji or a default */}
                      {testimonial.avatarEmoji.includes('👩') || testimonial.avatarEmoji.includes('女性') ? <i className="fas fa-female"></i> : 
                       testimonial.avatarEmoji.includes('👨') || testimonial.avatarEmoji.includes('男性') ? <i className="fas fa-male"></i> : 
                       <i className="fas fa-user"></i>}
                    </div>
                    <div>
                      <p className="font-semibold" style={{color: 'var(--primary-navy)'}}>{testimonial.nameAndRole}</p>
                      <div style={{color: 'var(--accent-gold)'}}>
                        {'★'.repeat(testimonial.ratingStars)}{'☆'.repeat(5 - testimonial.ratingStars)}
                      </div>
                    </div>
                  </div>
                  <p className="text-luxury">{testimonial.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-luxury bg-var(--neutral-100) p-6 rounded-lg">現在、お客様の声は登録されていません。</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReliabilitySection;