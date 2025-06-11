<!DOCTYPE html>
<html>
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
      }
      .paper {
        width: 100%;
        box-sizing: border-box;
        padding: 0; /* Remove padding since we're using @page margins */
      }
      .header {
        position: relative;
        text-align: center;
        margin-bottom: 5px;
        padding-top: 20px;
        min-height: 120px; /* Ensure consistent header height */
      }
      .header-logo {
        width: 100px; /* Increased logo size */
        height: 100px;
        object-fit: contain;
      }
      .header-logo.left {
        position: absolute;
        left: 0;
        top: 20px;
      }
      .header-logo.right {
        position: absolute;
        right: 0;
        top: 20px;
      }
      .header-code {
        position: absolute;
        left: 0;
        top: 125px; /* Adjusted for larger logo */
        font-size: 12px;
      }
      .header-center {
        margin: 0 120px; /* Increased margin to accommodate larger logos */
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
        margin-bottom: 15px;
      }
      .subject-section:first-of-type {
        margin-top: 0;
      }
      .subject-header {
        font-size: 12pt;
        font-weight: bold;
        margin: 5px 0;
        padding: 3px 0;
        border-bottom: 2px solid #333;
      }
      .total-items {
        font-size: 10pt;
        color: #666;
      }

      .question {
        margin-bottom: 15px;
        page-break-inside: avoid;
      }
      .question-text {
        margin-bottom: 10px;
        font-weight: normal;
      }
      .choices { margin-left: 20px; }
      .choice {
        margin-bottom: 10px;
        page-break-inside: avoid;
      }
      
      .image-container {
        text-align: center;
        margin: 15px 0;
        max-width: 100%;
        overflow: hidden;
      }
      .question-image {
        max-width: 33.33%; /* One-third of page width */
        min-width: 300px; /* Minimum width */
        height: auto;
        object-fit: contain;
      }
      .choice-image {
        max-width: 33.33%; /* One-third of page width */
        min-width: 250px; /* Minimum width */
        height: auto;
        object-fit: contain;
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
    </style>
  </head>
  <body>
    <div class="paper">
      <div class="header">
        <img src="{{ $leftLogoPath }}" class="header-logo left" alt="University Seal" onerror="this.style.display='none'" />
        <div class="header-code">JRMSU-COE-027</div>
        <div class="header-center">
          <div class="gov-line">Republic of the Philippines</div>
          <div class="univ-name">JOSE RIZAL MEMORIAL STATE UNIVERSITY</div>
          <div class="tagline">The Premiere University in Zamboanga del Norte</div>
          <div class="college">COLLEGE OF ENGINEERING</div>
          <div class="qe-exam-title">{{ $examTitle }}</div>
        </div>
        <img src="{{ $rightLogoPath }}" class="header-logo right" alt="College Logo" onerror="this.style.display='none'" />
      </div>

      <div class="student-info">
        <div class="info-field">
          <span class="info-label">Name:</span>
          <span class="info-value">&nbsp;</span>
        </div>
        <div class="info-field">
          <span class="info-label">Date:</span>
          <span class="info-value">&nbsp;</span>
        </div>
        <div class="info-field">
          <span class="info-label">Section:</span>
          <span class="info-value">&nbsp;</span>
        </div>
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
        @if($questionNumber > 1 && ($questionNumber - 1) % 5 == 0)
        <div style="page-break-after: always"></div>
        @endif

        <div class="question">
          <div class="question-text">
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

          <div class="choices">
            @foreach ($question['choices'] as $choiceIndex => $choice)
            <div class="choice">
              {{ chr(65 + $choiceIndex) }}. {!! $choice['choiceText'] ?? '' !!}

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
            @endforeach
          </div>
        </div>
        @php $questionNumber++; @endphp 
        @endforeach
      </div>
      @endforeach
    </div>
  </body>
</html>