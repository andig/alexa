# Specify the provider and access details
provider "aws" {
  region = "${var.aws_region}"
}

# This resource is the core take away of this example.
resource "aws_lambda_permission" "default" {
  statement_id  = "AllowExecutionFromAlexa"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.default.function_name}"
  principal     = "alexa-appkit.amazon.com"
}

resource "aws_lambda_function" "default" {
  filename         = "${var.lambda_source_file}"
  source_code_hash = "${base64sha256(file(var.lambda_source_file))}"
  function_name    = "${var.lambda_name}"
  role             = "${aws_iam_role.default.arn}"
  handler          = "${var.lambda_handler}"
  runtime          = "${var.lambda_runtime}"
}

resource "aws_iam_role" "default" {
  name = "terraform_lambda_alexa_example"

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
  name = "terraform_lambda_alexa_example"
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
            "Resource": "*"
        }
    ]
}
EOF
}