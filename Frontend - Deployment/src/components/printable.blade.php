<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $examTitle }}</title>
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-top: 20px;
            line-height: 1.5;
        }
        .header .gov-line {
            font-weight: bold;
            font-size: 12pt;
        }
        .header .univ-name {
            font-weight: bold;
            font-size: 13pt;
        }
        .header .tagline {
            font-style: italic;
            font-size: 10pt;
        }
        .header .college {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 10px;
        }
        .header h2 {
            margin: 10px 0 5px 0;
            font-size: 14pt;
        }
        .question {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .question-text {
            margin-bottom: 10px;
            font-weight: normal;
        }
        .choices {
            margin-left: 20px;
        }
        .choice {
            margin-bottom: 10px;
            page-break-inside: avoid;
        }
        .question-image {
            max-width: 400px;
            max-height: 200px;
            margin: 10px auto;
            display: block;
        }
        .choice-image {
            max-width: 200px;
            max-height: 100px;
            margin: 5px auto;
            display: block;
        }
        .image-container {
            text-align: center;
            margin: 10px 0;
        }
        .subject-info {
            font-style: italic;
            color: #666;
            font-size: 9pt;
            margin-left: 5px;
        }
        .student-info {
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding: 10px 0;
        }
        .info-field {
            margin: 10px 0;
        }
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
            margin-bottom: 30px;
            page-break-before: always;
        }
        .subject-section:first-of-type {
            page-break-before: avoid;
        }
        .subject-header {
            font-size: 12pt;
            font-weight: bold;
            margin: 20px 0;
            padding: 5px 0;
            border-bottom: 2px solid #333;
        }
        .total-items {
            font-size: 10pt;
            color: #666;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="gov-line">Republic of the Philippines</div>
        <div class="univ-name">JOSE RIZAL MEMORIAL STATE UNIVERSITY</div>
        <div class="tagline">The Premiere University in Zamboanga del Norte</div>
        <div class="college">COLLEGE OF ENGINEERING</div>
        <h2>{{ $examTitle }}</h2>
        <p>Total Items: {{ array_sum(array_map(function($subject) { return $subject['totalItems']; }, $questionsBySubject)) }}</p>
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

    @php $globalQuestionNumber = 1; @endphp
    
    @foreach ($questionsBySubject as $subjectData)
        <div class="subject-section">
            <div class="subject-header">
                {{ $subjectData['subject'] }}
                <div class="total-items">Number of Items: {{ $subjectData['totalItems'] }}</div>
            </div>

            @foreach ($subjectData['questions'] as $question)
                @if($globalQuestionNumber > 1 && ($globalQuestionNumber - 1) % 5 == 0)
                    <div style="page-break-after: always;"></div>
                @endif
                
                <div class="question">
                    <div class="question-text">
                        {{ $globalQuestionNumber }}. {!! $question['questionText'] ?? 'Question text not available' !!}
                    </div>

                    @if (!empty($question['questionImage']))
                        <div class="image-container">
                            <img 
                                class="question-image" 
                                src="{{ $question['questionImage'] }}" 
                                alt="Question Image"
                                onerror="this.style.display='none'"
                            >
                        </div>
                    @endif

                    <div class="choices">
                        @foreach ($question['choices'] as $choiceIndex => $choice)
                            <div class="choice">
                                {{ chr(65 + $choiceIndex) }}.
                                @if(!empty($choice['choiceText']))
                                    {!! $choice['choiceText'] !!}
                                @endif
                                
                                @if(!empty($choice['choiceImage']))
                                    <div class="image-container">
                                        <img 
                                            class="choice-image" 
                                            src="{{ $choice['choiceImage'] }}" 
                                            alt="Choice {{ chr(65 + $choiceIndex) }} Image"
                                            onerror="this.style.display='none'"
                                        >
                                    </div>
                                @endif
                            </div>
                        @endforeach
                    </div>
                </div>
                @php $globalQuestionNumber++; @endphp
            @endforeach
        </div>
    @endforeach
</body>
</html>