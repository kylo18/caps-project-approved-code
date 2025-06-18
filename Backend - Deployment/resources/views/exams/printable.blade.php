<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $examTitle }}</title>
    <style>
      @page {
        size: A4;
        margin: 2.54cm; /* Standard 1-inch margins on all sides */
      }
      body {
        font-family: "Times New Roman", Times, serif;
        font-size: 11pt;
        line-height: 1.3;
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .paper {
        width: 100%;
        box-sizing: border-box;
        padding: 0;
      }
      .header {
        position: relative;
        text-align: center;
        margin-bottom: 10px;
        padding-top: 5px;
        min-height: 80px;
      }
      .header-logo {
        width: 90px;
        height: 90px;
        object-fit: contain;
        max-width: 100%;
      }
      .header-logo.left {
        position: absolute;
        left: 5px;
        top: 10px;
      }
      .header-logo.right {
        position: absolute;
        right: 5px;
        top: 10px;
      }
      .header-code {
        position: absolute;
        left: 0;
        top: 95px;
        font-size: 12px;
      }
      .header-center {
        margin: 0 100px;
      }
      .gov-line { font-size: 13px; }
      .univ-name {
        font-weight: bold;
        font-size: 16px;
        margin: 5px 0;
      }
      .tagline { font-size: 13px; }
      .college {
        font-weight: bold;
        font-size: 18px;
        margin: 7px 0;
      }
      .qe-exam-title {
        font-size: 14px;
        font-weight: bold;
        margin: 10px 0;
      }
      .total-items-header { display: none; }
      
      .student-info {
        margin: 5px 0;
        border-bottom: 1px solid #ccc;
        padding: 5px 0;
      }
      .info-field { margin: 3px 0; }
      .info-label {
        font-weight: bold;
        margin-right: 5px;
      }
      .info-value {
        border-bottom: 1px solid #000;
        display: inline-block;
        min-width: 200px;
      }

      .subject-section {
        margin-bottom: 5px;
        page-break-before: avoid;
      }
      .subject-section:first-of-type {
        margin-top: 0;
      }
      .subject-header {
        font-size: 12pt;
        font-weight: bold;
        margin: 2px 0;
        padding: 1px 0;
        border-bottom: 2px solid #333;
        page-break-after: avoid;
      }
      .total-items {
        font-size: 10pt;
        color: #666;
      }

      .question {
        margin-bottom: 15px;
        page-break-inside: auto;
      }
      .question-text {
        margin-bottom: 3px;
        font-weight: normal;
        page-break-inside: auto;
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }
      .question-text-content {
        flex: 1;
      }
      .choices {
        margin-left: 20px;
        margin-bottom: 5px;
        page-break-inside: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 30px;
      }
      .choice {
        margin-bottom: 2px;
        page-break-inside: auto;
        display: flex;
        align-items: flex-start;
        width: 100%;
        min-width: 0;
      }
      .choice-letter {
        display: inline-block;
        min-width: 15px;
        font-weight: bold;
        margin-right: 5px;
        flex-shrink: 0;
        padding-top: 3px;
      }
      .choice-content {
        display: inline-block;
        flex: 1;
        word-wrap: break-word;
        min-width: 0;
      }
      
      .image-container {
        margin: 10px 0;
        max-width: 100%;
        overflow: hidden;
        text-align: left;
        page-break-inside: avoid;
      }
      .question-image {
        max-width: 100%;
        height: auto;
        max-height: 320px;
        object-fit: contain;
        border-radius: 0.5rem;
        margin-bottom: 20px;
      }
      .choice-image {
        max-width: 100%;
        height: auto;
        max-height: 140px;
        object-fit: contain;
        border-radius: 0.5rem;
        margin-top: 15px;
      }
      .image-error {
        font-style: italic;
        color: #666;
        font-size: 9pt;
        text-align: center;
        padding: 5px;
        border: 1px dashed #ccc;
        margin: 5px 0;
      }

      /* Answer Key Styles */
      .answer-key {
        page-break-before: always;
        margin-top: 20px;
      }
      .answer-key-header {
        text-align: center;
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 15px;
        border-bottom: 2px solid #000;
        padding-bottom: 5px;
      }
      .answer-key-section {
        margin-bottom: 15px;
      }
      .answer-key-subject {
        font-weight: bold;
        font-size: 12pt;
        margin-bottom: 5px;
        border-bottom: 1px solid #ccc;
        padding-bottom: 3px;
      }
      .answer-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 10px;
        margin-bottom: 10px;
      }
      .answer-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .answer-number {
        font-weight: bold;
        min-width: 25px;
      }
      .answer-letter {
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="paper">
      <div class="header">
        <img src="{{ $leftLogoPath }}" class="header-logo left" alt="University Seal" onerror="this.style.display='none'" />
        <div class="header-center">
          <div class="gov-line">Republic of the Philippines</div>
          <div class="univ-name">JOSE RIZAL MEMORIAL STATE UNIVERSITY</div>
          <div class="tagline">The Premiere University in Zamboanga del Norte</div>
          <div class="college">COLLEGE OF ENGINEERING</div>
          <div class="qe-exam-title">{{ $examTitle }}</div>
        </div>
        <img src="{{ $rightLogoPath }}" class="header-logo right" alt="College Logo" onerror="this.style.display='none'" />
      </div>

      @php $questionNumber = 1; @endphp 
      
      @foreach ($questionsBySubject as $subjectData)
      <div class="subject-section">
        <div class="subject-header">
          {{ $subjectData['subject'] }}
          <span class="total-items">
            ({{ $subjectData['totalItems'] }} items)
          </span>
        </div>

        @foreach ($subjectData['questions'] as $question)
        <div class="question">
          <div class="question-text">
            <div class="question-text-content">
              {{ $questionNumber }}. {!! $question['questionText'] ?? 'Question text not available' !!}
            </div>
            @if (!empty($question['questionImage']))
            <div class="image-container">
              <img
                class="question-image"
                src="{{ $question['questionImage'] }}"
                alt="Question Image"
                onerror="this.parentElement.innerHTML='<div class=\'image-error\'>[Image not available]</div>'"
              />
            </div>
            @endif
          </div>

          <div class="choices">
            @foreach ($question['choices'] as $choiceIndex => $choice)
            <div class="choice">
              <span class="choice-letter">{{ chr(65 + $choiceIndex) }}.</span>
              <div class="choice-content">
                {!! $choice['choiceText'] ?? '' !!}

                @if(!empty($choice['choiceImage']))
                <div class="image-container">
                  <img
                    class="choice-image"
                    src="{{ $choice['choiceImage'] }}"
                    alt="Choice {{ chr(65 + $choiceIndex) }} Image"
                    onerror="this.parentElement.innerHTML='<div class=\'image-error\'>[Choice image not available]</div>'"
                  />
                </div>
                @endif
              </div>
            </div>
            @endforeach
          </div>
        </div>
        @php $questionNumber++; @endphp 
        @endforeach
      </div> 
      @endforeach

      <!-- Answer Key Section -->
      <div class="answer-key">
        <div class="answer-key-header">ANSWER KEY</div>
        
        @foreach ($questionsBySubject as $subjectData)
        <div class="answer-key-section">
          <div class="answer-key-subject">{{ $subjectData['subject'] }}</div>
          <div class="answer-grid">
            @php 
              $startNumber = 1;
              foreach ($questionsBySubject as $prevSubject) {
                if ($prevSubject['subject'] === $subjectData['subject']) {
                  break;
                }
                $startNumber += $prevSubject['totalItems'];
              }
            @endphp
            
            @foreach ($subjectData['questions'] as $index => $question)
              @php
                $questionNumber = $startNumber + $index;
                $correctChoice = null;
                foreach ($question['choices'] as $choiceIndex => $choice) {
                  if ($choice['isCorrect']) {
                    $correctChoice = chr(65 + $choiceIndex);
                    break;
                  }
                }
              @endphp
              <div class="answer-item">
                <span class="answer-number">{{ $questionNumber }}.</span>
                <span class="answer-letter">{{ $correctChoice }}</span>
              </div>
            @endforeach
          </div>
        </div>
        @endforeach
      </div>
    </div>
  </body>
</html>