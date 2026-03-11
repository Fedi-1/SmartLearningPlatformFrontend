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
    { icon: '🤖', value: 'Llama 3.3', suffix: ' 70B', label: 'AI Model' },
    { icon: '🔁', value: 'SM-2', suffix: '', label: 'Flashcard Algorithm' },
    { icon: '�️', value: 'Real-Time', suffix: '', label: 'Exam Monitoring' },
    { icon: '📜', value: 'UUID', suffix: '', label: 'Certificate Verification' },
  ];

  features = [
    { icon: '�', title: 'AI Course Generation', description: 'Upload any PDF or DOCX document and get a complete personalized course with lessons, quizzes, and flashcards generated instantly by Llama 3.3 70B.' },
    { icon: '🃏', title: 'Spaced Repetition Flashcards', description: 'Study smarter with flashcards powered by the SM-2 spaced repetition algorithm — scientifically proven to maximize long-term retention.' },
    { icon: '🎯', title: 'Adaptive Quizzes', description: 'AI-generated quizzes with fresh questions on every attempt. Previous questions are excluded to ensure varied, effective practice.' },
    { icon: '🛡️', title: 'Anti-Cheat Exam System', description: 'Real-time monitoring during final exams detects tab switching, copy-paste attempts, and unusual behavior to ensure academic integrity.' },
    { icon: '📜', title: 'Verified Certificates', description: 'Earn certificates upon passing your final exam. Every certificate has a unique UUID that can be verified by anyone instantly.' },
    { icon: '🎬', title: 'Lesson Recap Videos', description: 'Each lesson includes an AI-narrated recap video generated with ElevenLabs TTS to reinforce what you learned.' },
  ];

  steps = [
    { number: '01', title: 'Create Your Account', description: 'Sign up for free in under a minute.' },
    { number: '02', title: 'Upload Your Document', description: 'Upload any PDF or DOCX file — lecture notes, textbooks, or study guides.' },
    { number: '03', title: 'AI Generates Your Course', description: 'Llama 3.3 70B analyzes your document and builds a complete course with lessons, quizzes, flashcards, and a final exam.' },
    { number: '04', title: 'Learn and Get Certified', description: 'Study at your own pace, pass the final exam, and earn a verified certificate.' },
  ];

  private statsAnimated = false;
  private statsObserver?: IntersectionObserver;
  private revealObserver?: IntersectionObserver;

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
  }

  ngOnDestroy(): void {
    this.statsObserver?.disconnect();
    this.revealObserver?.disconnect();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // ── Scroll reveal ────────────────────────────────────────────────────────
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

    // Observe every element that has the reveal class
    const targets = this.el.nativeElement.querySelectorAll('.reveal');
    targets.forEach((t: Element) => this.revealObserver!.observe(t));
  }

  // ── Stats counter ────────────────────────────────────────────────────────
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
    // Stats are now static text values — no counter animation needed.
  }
}
