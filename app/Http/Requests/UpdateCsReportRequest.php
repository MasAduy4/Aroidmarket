<?php

namespace App\Http\Requests;

use App\Models\CsReport;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCsReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'orderId' => ['sometimes', 'string', 'max:100'],
            'customer' => ['sometimes', 'string', 'max:150'],
            'category' => ['sometimes', 'string', 'max:100'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', Rule::in([
                CsReport::STATUS_OPEN,
                CsReport::STATUS_IN_PROGRESS,
                CsReport::STATUS_RESOLVED,
            ])],
        ];
    }
}
