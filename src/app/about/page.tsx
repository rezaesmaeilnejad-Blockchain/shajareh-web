export default function AboutPage() {
  return (
    <div className="relative mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      {/* soft background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white/60" />
      </div>

      <div className="rounded-[28px] border bg-white/70 p-5 shadow-sm backdrop-blur md:p-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {/* halo */}
            <div
              aria-hidden
              className="absolute -inset-6 rounded-full bg-primary/15 blur-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="لوگوی شجره‌نامه"
              className="relative h-20 w-20 rounded-3xl border bg-white object-contain shadow-sm"
            />
          </div>

          <div className="mt-5">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">
              درباره شجره‌نامه
            </h1>
            <p className="mt-2 text-sm leading-7 text-gray-600 md:text-base">
              معرفی پروژه، هدف فرهنگی، و مسیر آینده برای توسعه‌ی یک سامانه قابل اعتماد
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-2xl border bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              گروه دانش‌بنیان ماژلان
            </span>
            <span className="rounded-2xl border bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              حفظ هویت و اصالت خانوادگی
            </span>
            <span className="rounded-2xl border bg-white px-3 py-1 text-xs font-semibold text-gray-700">
              چشم‌انداز بلاک‌چین و NFT
            </span>
          </div>
        </div>

        {/* Body cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-900">هدف</div>
            <p className="mt-2 text-sm leading-8 text-gray-700 text-center">
              این اپلیکیشن توسط گروه دانش‌بنیان <span className="font-semibold">ماژلان</span>{" "}
              برای حفظ فرهنگ غنی ایرانیان نوشته شده است تا اصالت خانوادگی اشخاص با گذر زمان و
              چشم از جهان گشودن بزرگان اقوام ایرانی از ذهن‌ها و تاریخ حذف نشود.
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-900">نسخه‌های آینده</div>
            <p className="mt-2 text-sm leading-8 text-gray-700 text-center">
              در آینده این اپلیکیشن قصد دارد نسخه به‌روز شده‌ای مبتنی بر تکنولوژی بلاک‌چین و
              الگوریتم اجماع داشته باشد تا صحت‌سنجی و اعتبارسنجی شجره‌نامه‌ها بر مبنای بلاک‌چین
              انجام پذیرد و اشخاص در قالب یک توکن غیر قابل معاوضه{" "}
              (<span className="font-semibold">NFT</span>) نمایش داده شوند.
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm md:col-span-2">
            <div className="text-sm font-bold text-gray-900">
              یکپارچگی با ثبت و احوال
            </div>
            <p className="mt-2 text-sm leading-8 text-gray-700 text-center">
              همچنین در صورت به‌وجود آمدن شرایط ممکن و همکاری سازمان ثبت و احوال، با کد ملی افراد
              یکپارچه شده باشد تا در آمارگیری و سایر خدمات دولتی یک سامانه قابل اتکا و کارآمد
              برای اولین بار در جهان داشته باشیم.
            </p>
          </div>
        </div>

        {/* Use cases */}
        <div className="mt-8 rounded-3xl border bg-primary/5 p-5">
          <div className="text-center text-sm font-extrabold text-gray-900">
            نمونه‌ای از قابلیت‌های آینده
          </div>
          <p className="mt-2 text-center text-xs leading-6 text-gray-700">
            برخی قابلیت‌هایی که می‌توانند روی نسخه بلاک‌چینی و ضدتقلب توسعه داده شوند:
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-white/70 p-4 text-center">
              <div className="text-xs font-bold text-gray-900">کارت‌های بانکی</div>
              <div className="mt-1 text-xs leading-6 text-gray-600">
                اختصاص و مدیریت هویت مالی امن
              </div>
            </div>

            <div className="rounded-2xl border bg-white/70 p-4 text-center">
              <div className="text-xs font-bold text-gray-900">مدارک تحصیلی و سجلی</div>
              <div className="mt-1 text-xs leading-6 text-gray-600">
                ثبت و ارائه‌ی قابل راستی‌آزمایی
              </div>
            </div>

            <div className="rounded-2xl border bg-white/70 p-4 text-center">
              <div className="text-xs font-bold text-gray-900">رأی‌گیری امن</div>
              <div className="mt-1 text-xs leading-6 text-gray-600">
                شفاف، غیرقابل نفوذ و ضدتقلب
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-xs leading-6 text-gray-700">
            کاربردهای بیشماری از قبیل اختصاص کارت‌های بانکی / مدارک تحصیلی و سجلی افراد / حق رأی
            دادن امن و تضمین شده بر بستر بلاک‌چین در انتخابات‌ها می‌توانند برخی از قابلیت‌های
            غیر قابل نفوذ و تقلب سامانه آتی شجره‌نامه بر بستر بلاک‌چین باشند.
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-7 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl border bg-white px-4 py-2 text-xs text-gray-600">
            نسخه فعلی برای ثبت و نمایش شجره‌نامه طراحی شده و قابلیت‌های بلاک‌چین در فازهای بعدی
            اضافه خواهند شد.
          </div>
        </div>
      </div>
    </div>
  );
}