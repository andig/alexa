variable "aws_region" {
  description = "Target AWS region"
  default     = "eu-central-1"
}

variable "lambda_name" {
  description = "Lambda function name"
  default     = "volkszaehler-briefing"
}

variable "lambda_source_file" {
  description = "Lamda source file"
  default     = "dist/volkszaehler-briefing.zip"
}

variable "lambda_handler" {
  description = "Lambda function public entry point"
  default = "index.handler"
}

variable "lambda_runtime" {
  description = "Lambda function runtime environment"
  default = "nodejs8.10"
}
