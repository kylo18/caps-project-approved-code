<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $subjectName }}</title>
    <style>
        @page {
            size: A4;
            margin: 0.5cm;
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
        }
        .header h2 {
            margin: 0;
            padding: 0;
            font-size: 14pt;
        }
        .question {
            margin-bottom: 20px;
            page-break-inside: avoid;
            clear: both;
        }
        .question-number {
            margin-bottom: 10px;
            font-weight: normal;
        }
        .choices {
            padding-left: 20px;
            clear: both;
        }
        .choice-pair {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            clear: both;
        }
        .choice-label {
            width: 48%;
            position: relative;
        }
        .question-image {
            max-width: 80%;
            max-height: 200px;
            margin: 10px auto;
            display: block;
        }
        .choice-image {
            max-width: 100%;
            max-height: 100px;
            margin: 5px 0;
            display: block;
        }
        .subject-info {
            font-style: italic;
            color: #666;
            font-size: 9pt;
            margin-top: 5px;
        }
        .student-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding: 10px 0;
        }
        .info-field {
            margin: 0 10px;
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
        .difficulty-info {
            font-size: 9pt;
            color: #666;
            margin-left: 10px;
        }
        .page-break {
            page-break-after: always;
        }
        @media print {
            body {
                width: 21cm;
                height: 29.7cm;
            }
            .header {
                position: running(header);
            }
            .student-info {
                position: running(student-info);
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>{{ $subjectName }}</h2>
        <p>Total Items: {{ count($formattedQuestions) }}</p>
    </div>

    <div class="student-info">
        <div class="info-field">
            <span class="info-label">Name:</span>
            <span class="info-value"></span>
        </div>
        <div class="info-field">
            <span class="info-label">Date:</span>
            <span class="info-value"></span>
        </div>
        <div class="info-field">
            <span class="info-label">Section:</span>
            <span class="info-value"></span>
        </div>
    </div>

    @foreach ($formattedQuestions as $index => $q)
        @if($index > 0 && $index % 25 == 0)
            <div class="page-break"></div>
        @endif
        
        <div class="question">
            <div class="question-number">
                {{ $index + 1 }}. {{ $q['questionText'] }}
                @if(isset($q['subject']))
                    <span class="subject-info">({{ $q['subject'] }})</span>
                @endif
                @if(isset($q['difficulty']))
                    <span class="difficulty-info">[{{ ucfirst($q['difficulty']) }}]</span>
                @endif
            </div>

            @if ($q['questionImage'])
                <img class="question-image" src="{{ $q['questionImage'] }}" alt="Question image">
            @endif

            <div class="choices">
                @php
                    $lastChoice = end($q['choices']);
                    $regularChoices = array_slice($q['choices'], 0, -1);
                    $isNoneOfAbove = $lastChoice && strpos(strtolower($lastChoice['choiceText']), 'none of the above') !== false;
                @endphp

                @foreach (array_chunk($regularChoices, 2) as $choicePair)
                    <div class="choice-pair">
                        @foreach ($choicePair as $choiceIndex => $choice)
                            <div class="choice-label">
                                {{ chr(65 + $choiceIndex) }}. 
                                @if($choice['choiceText'])
                                    {{ $choice['choiceText'] }}
                                @endif
                                @if($choice['choiceImage'])
                                    <img class="choice-image" src="{{ $choice['choiceImage'] }}" alt="Choice image">
                                @endif
                            </div>
                        @endforeach
                    </div>
                @endforeach

                @if($isNoneOfAbove)
                    <div class="choice-pair">
                        <div class="choice-label">
                            {{ chr(65 + count($regularChoices)) }}. {{ $lastChoice['choiceText'] }}
                            @if($lastChoice['choiceImage'])
                                <img class="choice-image" src="{{ $lastChoice['choiceImage'] }}" alt="Choice image">
                            @endif
                        </div>
                    </div>
                @endif
            </div>
        </div>
    @endforeach
</body>
</html>