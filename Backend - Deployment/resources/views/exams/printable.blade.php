<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $subjectName }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .question {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }
        .question-number {
            margin-bottom: 10px;
            font-weight: normal;
        }
        .choices {
            padding-left: 20px;
        }
        .choice-pair {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .choice-label {
            width: 48%;
        }
        img {
            max-width: 300px;
            max-height: 200px;
            margin: 10px 0;
        }
        .subject-info {
            font-style: italic;
            color: #666;
            font-size: 10px;
            margin-top: 5px;
        }
        .student-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>{{ $subjectName }}</h2>
        <p>Total Items: {{ count($formattedQuestions) }}</p>
    </div>

    <div class="student-info">
        <div>
            <span style="font-weight: bold;">Name:</span>
            <span style="display: inline-block; border-bottom: 1px solid #000; min-width: 180px; margin-left: 5px;"></span>
        </div>
        <div>
            <span style="font-weight: bold;">Date:</span>
            <span style="display: inline-block; border-bottom: 1px solid #000; min-width: 120px; margin-left: 5px;"></span>
        </div>
    </div>

    @foreach ($formattedQuestions as $index => $q)
        <div class="question">
            <div class="question-number">
                {{ $index + 1 }}. {{ $q['questionText'] }}
                @if(isset($q['subject']))
                    <div class="subject-info">({{ $q['subject'] }})</div>
                @endif
            </div>

            @if ($q['questionImage'])
                <img src="{{ $q['questionImage'] }}" alt="Question image">
            @endif

            <div class="choices">
                @php
                    $lastChoice = end($q['choices']);
                    $regularChoices = array_slice($q['choices'], 0, -1);
                    $isNoneOfAbove = strpos(strtolower($lastChoice['choiceText']), 'none of the above') !== false;
                @endphp

                @foreach (array_chunk($regularChoices, 2) as $choicePair)
                    <div class="choice-pair">
                        @foreach ($choicePair as $index => $choice)
                            <div class="choice-label">
                                {{ chr(65 + $index) }}. 
                                @if($choice['choiceText'])
                                    {{ $choice['choiceText'] }}
                                @endif
                                @if($choice['choiceImage'])
                                    <img src="{{ $choice['choiceImage'] }}" alt="Choice image">
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
                                <img src="{{ $lastChoice['choiceImage'] }}" alt="Choice image">
                            @endif
                        </div>
                    </div>
                @endif
            </div>
        </div>
    @endforeach
</body>
</html>