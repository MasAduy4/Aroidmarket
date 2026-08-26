<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCsReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Semua user yang sudah login boleh membuat report.
        // Batasi lebih lanjut lewat middleware/policy role jika diperlukan.
        return true;
    }

    public function rules(): array
    {
        return [
            'orderId' => ['required', 'string', 'max:100'],
            'customer' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string'],
            'isEscalation' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'orderId.required' => 'Order ID wajib diisi.',
            'customer.required' => 'Nama customer wajib diisi.',
            'category.required' => 'Kategori report wajib dipilih.',
            'description.required' => 'Deskripsi report wajib diisi.',
        ];
    }
}
