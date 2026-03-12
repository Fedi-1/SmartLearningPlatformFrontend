// src/app/features/landing/landing.component.ts
import { Component, OnInit, OnDestroy, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatWidgetComponent } from '../../shared/components/chat-widget/chat-widget.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, ChatWidgetComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

  isScrolled = false;
  isMobileMenuOpen = false;

  stats = [
    {
      value: '70B',
      label: 'AI Model',
      sublabel: 'Llama 3.3',
      gradientFrom: '#8B5CF6',
      gradientTo: '#7C3AED',
      shadowColor: 'rgba(139,92,246,0.3)',
      iconPath: 'M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM9 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
      iconViewBox: '0 0 24 24',
    },
    {
      value: 'SM-2',
      label: 'Flashcard Algorithm',
      sublabel: 'Spaced Repetition',
      gradientFrom: '#F43F5E',
      gradientTo: '#EC4899',
      shadowColor: 'rgba(244,63,94,0.3)',
      iconPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      iconViewBox: '0 0 24 24',
    },
    {
      value: 'Real-Time',
      label: 'Exam Monitoring',
      sublabel: 'Anti-Cheat',
      gradientFrom: '#F59E0B',
      gradientTo: '#EA580C',
      shadowColor: 'rgba(245,158,11,0.3)',
      iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      iconViewBox: '0 0 24 24',
    },
    {
      value: 'UUID',
      label: 'Certificate Verification',
      sublabel: 'Verifiable',
      gradientFrom: '#10B981',
      gradientTo: '#16A34A',
      shadowColor: 'rgba(16,185,129,0.3)',
      iconPath: 'M8.21 13.89L7 23l5-3 5 3-1.21-9.11M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
      iconViewBox: '0 0 24 24',
    },
  ];

  features = [
    {
      title: 'AI Course Generation',
      description: 'Upload any PDF or DOCX document and get a complete personalized course with lessons, quizzes, and flashcards generated instantly by Llama 3.3 70B.',
      gradientFrom: '#8B5CF6', gradientTo: '#7C3AED', shadowColor: 'rgba(139,92,246,0.2)',
      iconPath: 'M12 8V4H8M12 8H8M12 8h4M12 8v4m0 0H8m4 0h4m0 0v4m-4 0H8m4 0h4',
    },
    {
      title: 'Spaced Repetition Flashcards',
      description: 'Study smarter with flashcards powered by the SM-2 spaced repetition algorithm — scientifically proven to maximize long-term retention.',
      gradientFrom: '#F43F5E', gradientTo: '#EC4899', shadowColor: 'rgba(244,63,94,0.2)',
      iconPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    },
    {
      title: 'Adaptive Quizzes',
      description: 'AI-generated quizzes with fresh questions on every attempt. Previous questions are excluded to ensure varied, effective practice.',
      gradientFrom: '#F97316', gradientTo: '#F59E0B', shadowColor: 'rgba(249,115,22,0.2)',
      iconPath: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
    },
    {
      title: 'Anti-Cheat Exam System',
      description: 'Real-time monitoring during final exams detects tab switching, copy-paste attempts, and unusual behavior to ensure academic integrity.',
      gradientFrom: '#06B6D4', gradientTo: '#3B82F6', shadowColor: 'rgba(6,182,212,0.2)',
      iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    },
    {
      title: 'Verified Certificates',
      description: 'Earn certificates upon passing your final exam. Every certificate has a unique UUID that can be verified by anyone instantly.',
      gradientFrom: '#F59E0B', gradientTo: '#EAB308', shadowColor: 'rgba(245,158,11,0.2)',
      iconPath: 'M8.21 13.89L7 23l5-3 5 3-1.21-9.11M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    },
    {
      title: 'Lesson Recap Videos',
      description: 'Each lesson includes an AI-narrated recap video generated with ElevenLabs TTS to reinforce what you learned.',
      gradientFrom: '#10B981', gradientTo: '#22C55E', shadowColor: 'rgba(16,185,129,0.2)',
      iconPath: 'M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.89L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z',
    },
  ];

  steps = [
    {
      number: '01',
      title: 'Create Your Account',
      description: 'Sign up for free in under a minute.',
      gradientFrom: '#8B5CF6', gradientTo: '#7C3AED', shadowColor: 'rgba(139,92,246,0.3)',
      iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      highlight: false,
    },
    {
      number: '02',
      title: 'Upload Your Document',
      description: 'Upload any PDF or DOCX file — lecture notes, textbooks, or study guides.',
      gradientFrom: '#06B6D4', gradientTo: '#3B82F6', shadowColor: 'rgba(6,182,212,0.3)',
      iconPath: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
      highlight: false,
    },
    {
      number: '03',
      title: 'AI Generates Your Course',
      description: 'Llama 3.3 70B analyzes your document and builds a complete course with lessons, quizzes, flashcards, and a final exam.',
      gradientFrom: '#F59E0B', gradientTo: '#EA580C', shadowColor: 'rgba(245,158,11,0.3)',
      iconPath: 'M5 3l14 9-14 9V3z',
      highlight: true,
    },
    {
      number: '04',
      title: 'Learn and Get Certified',
      description: 'Study at your own pace, pass the final exam, and earn a verified certificate.',
      gradientFrom: '#10B981', gradientTo: '#22C55E', shadowColor: 'rgba(16,185,129,0.3)',
      iconPath: 'M8.21 13.89L7 23l5-3 5 3-1.21-9.11M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
      highlight: false,
    },
  ];

  private statsAnimated = false;
  private statsObserver?: IntersectionObserver;
  private revealObserver?: IntersectionObserver;
  private stepsObserver?: IntersectionObserver;

  visibleSteps: boolean[] = [false, false, false, false];
  lineProgress = 0;

  constructor(private el: ElementRef) {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 60;
  }

  ngOnInit(): void {
    this.observeStats();
  }

  ngAfterViewInit(): void {
    this.setupReveal();
    this.setupStepsAnimation();
  }

  ngOnDestroy(): void {
    this.statsObserver?.disconnect();
    this.revealObserver?.disconnect();
    this.stepsObserver?.disconnect();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  private setupReveal(): void {
    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          } else {
            entry.target.classList.remove('revealed');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    const targets = this.el.nativeElement.querySelectorAll('.reveal');
    targets.forEach((t: Element) => this.revealObserver!.observe(t));
  }

  private setupStepsAnimation(): void {
    const container = this.el.nativeElement.querySelector('.steps-grid');
    if (!container) return;
    this.stepsObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        this.steps.forEach((_, i) => {
          setTimeout(() => {
            this.visibleSteps[i] = true;
            this.lineProgress = (i + 1) * 25;
          }, i * 300);
        });
        this.stepsObserver?.disconnect();
      }
    }, { threshold: 0.3 });
    this.stepsObserver.observe(container);
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
      }
    }, { threshold: 0.3 });
    this.statsObserver.observe(target);
  }
}
