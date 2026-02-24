import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, OnDestroy {

  isScrolled = false;
  isMobileMenuOpen = false;

  stats = [
    { value: 0, target: 50000, suffix: '+', label: 'Active Learners' },
    { value: 0, target: 1200,  suffix: '+', label: 'Courses' },
    { value: 0, target: 98,    suffix: '%', label: 'Satisfaction Rate' },
    { value: 0, target: 45,    suffix: '+', label: 'Expert Instructors' }
  ];

  features = [
    {
      icon: '🧠',
      title: 'AI-Powered Learning',
      description: 'Personalized study paths that adapt to your pace and learning style in real time.'
    },
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'Detailed progress dashboards and insights to keep you on track.'
    },
    {
      icon: '🎯',
      title: 'Adaptive Quizzes',
      description: 'Dynamic assessments that evolve with your knowledge level.'
    },
    {
      icon: '🃏',
      title: 'Flashcard System',
      description: 'Spaced repetition flashcards powered by memory science algorithms.'
    },
    {
      icon: '🏆',
      title: 'Certificates',
      description: 'Earn verifiable certificates upon course completion.'
    },
    {
      icon: '🔔',
      title: 'Smart Notifications',
      description: 'Stay on track with intelligent reminders and progress nudges.'
    }
  ];

  steps = [
    {
      number: '01',
      title: 'Create Your Account',
      description: 'Sign up for free in under a minute — no credit card required.'
    },
    {
      number: '02',
      title: 'Choose Your Path',
      description: 'Browse curated courses or let AI recommend the perfect learning path for you.'
    },
    {
      number: '03',
      title: 'Learn & Practice',
      description: 'Study with videos, quizzes, flashcards and hands-on exercises.'
    },
    {
      number: '04',
      title: 'Earn & Grow',
      description: 'Complete courses, earn certificates, and track your progress.'
    }
  ];

  private statsAnimated = false;
  private statsObserver?: IntersectionObserver;

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
  }

  ngOnInit(): void {
    this.observeStats();
  }

  ngOnDestroy(): void {
    this.statsObserver?.disconnect();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  private observeStats(): void {
    const target = document.querySelector('.stats-section');
    if (!target) {
      setTimeout(() => this.observeStats(), 300);
      return;
    }

    this.statsObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !this.statsAnimated) {
        this.statsAnimated = true;
        this.animateStats();
      }
    }, { threshold: 0.3 });

    this.statsObserver.observe(target);
  }

  private animateStats(): void {
    const duration = 2000;
    const steps    = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      this.stats = this.stats.map(s => ({
        ...s,
        value: Math.floor(s.target * eased)
      }));

      if (step >= steps) {
        clearInterval(timer);
        this.stats = this.stats.map(s => ({ ...s, value: s.target }));
      }
    }, interval);
  }
}
