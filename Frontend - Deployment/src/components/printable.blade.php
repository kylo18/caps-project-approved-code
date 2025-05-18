<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Printable Exam</title>
    <style>
        body {
          font-family: "Times New Roman", Times, serif;
            font-size: 14px;
            margin: 30px;
        }
        .question {
            margin-bottom: 30px;
        }
        .question img {
            max-width: 400px;
            display: block;
            margin: 10px 0;
        }
        .question-number {
            font-weight: bold;
        }
        .choices {
            margin-top: 10px;
            margin-left: 20px;
        }
        .choice-pair {
            display: flex;
            justify-content: space-between;
            max-width: 500px;
            margin-bottom: 5px;
        }
        .choice-label {
            width: 48%;
        }
    </style>
</head>
<body>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div style="flex: 1; text-align: center;">
            <div style="font-size: 16px;">Republic of the Philippines</div>
            <div style="font-size: 20px; font-weight: bold; color: #1a237e;">JOSE RIZAL MEMORIAL STATE UNIVERSITY</div>
            <div style="font-size: 15px; color: #e57373; font-style: italic;">The Premier University in Zamboanga del Norte</div>
            <div style="font-size: 15px;">Main Campus, Dapitan City</div>
        </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
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
            </div>

            @if ($q['questionImage'])
                <img src="{{ $q['questionImage'] }}" alt="Question image">
            @endif

            <div class="choices">
                <div class="choice-pair">
                    <div class="choice-label">A. {{ $q['choices'][0]['choiceText'] ?? '[No Text]' }}</div>
                    <div class="choice-label">C. {{ $q['choices'][2]['choiceText'] ?? '[No Text]' }}</div>
                </div>
                <div class="choice-pair">
                    <div class="choice-label">B. {{ $q['choices'][1]['choiceText'] ?? '[No Text]' }}</div>
                    <div class="choice-label">D. {{ $q['choices'][3]['choiceText'] ?? '[No Text]' }}</div>
                </div>

                @if (!empty($q['choices'][4]['choiceText']) || !empty($q['choices'][5]['choiceText']))
                    <div class="choice-pair">
                        <div class="choice-label">E. {{ $q['choices'][4]['choiceText'] ?? '[No Text]' }}</div>
                        <div class="choice-label">F. {{ $q['choices'][5]['choiceText'] ?? '[No Text]' }}</div>
                    </div>
                @endif
            </div>
        </div>
    @endforeach
</body>
</html>
