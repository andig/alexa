provider "aws" {
  region = "${var.aws_region}"
}

resource "aws_lambda_function" "default" {
  filename         = "${var.lambda_source_file}"
  source_code_hash = "${base64sha256(file(var.lambda_source_file))}"
  function_name    = "${var.lambda_name}"
  role             = "${aws_iam_role.default.arn}"
  handler          = "${var.lambda_handler}"
  runtime          = "${var.lambda_runtime}"
  timeout          = "30"
}

resource "aws_lambda_permission" "default" {
  statement_id  = "AllowExecutionFromAlexa"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.default.function_name}"
  principal     = "alexa-appkit.amazon.com"
}

resource "aws_iam_role" "default" {
  name = "${var.lambda_name}"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

####
# Alternatively you could attach the Amazon provided AWSLambdaBasicExecutionRole
# via an aws_iam_policy_attachment resource. However, the aws_iam_policy_attachment
# resource can be [destructive](https://www.terraform.io/docs/providers/aws/r/iam_policy_attachment.html)
# so it was avoided for the purporse of this example.
resource "aws_iam_role_policy" "default" {
  name = "${var.lambda_name}"
  role = "${aws_iam_role.default.id}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        }
    ]
}
EOF
}

#
# Monitoring/Alerting
#

resource "aws_cloudwatch_metric_alarm" "default" {
  alarm_name = "${var.lambda_name}-error"
  comparison_operator = "GreaterThanThreshold"
  period = "300"
  evaluation_periods = "1"
  metric_name = "Errors"
  namespace = "AWS/Lambda"
  statistic = "Average"
  threshold = "0"
  alarm_description = "${var.lambda_name} lambda health alarm"
  alarm_actions = [
    "${aws_sns_topic.default.arn}"
  ],
  dimensions {
    FunctionName = "${aws_lambda_function.default.function_name}"
  }
}

resource "aws_sns_topic" "default" {
  name = "${var.lambda_name}-error"
  count = "${var.sns_receiver_email != "" ? 1 : 0}"

  provisioner "local-exec" {
    command = "aws sns subscribe --topic-arn ${self.arn} --protocol email --notification-endpoint ${var.sns_receiver_email}"
  }
}

#
# Lambda warming
#

resource "aws_cloudwatch_event_rule" "check_lambda" {
    name = "every-five-minutes"
    count = "${var.lambda_warming_schedule != "" ? 1 : 0}"
    description = "Fires every five minutes"
    schedule_expression = "${var.lambda_warming_schedule}"
}

resource "aws_cloudwatch_event_target" "check_lambda" {
    rule = "${aws_cloudwatch_event_rule.check_lambda.name}"
    target_id = "default"
    arn = "${aws_lambda_function.default.arn}"
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_lambda" {
    statement_id = "AllowExecutionFromCloudWatch"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.default.function_name}"
    principal = "events.amazonaws.com"
    source_arn = "${aws_cloudwatch_event_rule.check_lambda.arn}"
}
