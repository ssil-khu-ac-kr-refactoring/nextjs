import Link from "next/link";

export default function People() {
  const professor = {
    name: "선 종호 (Seon, Jongho)",
    field: "Space Science Payload, Data Analysis",
    email: "jhseon@khu.ac.kr",
    position: "Professor",
    education: [
      "학사: 한국과학기술원 물리학과",
      "석사: Dept. of Physics and Astronomy, University of Iowa, Iowa City, USA",
      "박사: Dept. of Physics and Astronomy, University of Iowa, Iowa City, USA"
    ],
    career: [
      "한국과학기술원 인공위성연구센터",
      "현대전자 위성사업단",
      "(주)쎄트렉아이 우주기술연구소",
      "한국과학기술원 물리학과 겸직교수",
      "UC, Berkeley 우주과학연구소 객원교수",
      "한국우주과학회 학술이사/편집장"
    ],
    image: "/professor.jpg"
  };

  const researchers = [
    {
      name: "나고운 (Go-Woon Na)",
      field: "Digital electronics, Particle detector, Space weather",
      email: "gwna@khu.ac.kr",
      position: "Research Professor",
      phd: "Ehwa Womans University (2016)",
      image: "/researcher1.jpg"
    },
    {
      name: "안범수 (Beom-Su An)",
      field: "Particle detector, Digital electronics, Space weather",
      email: "bumsuan@khu.ac.kr",
      position: "Master course",
      image: "/researcher2.jpg"
    },
    {
      name: "오민혁 (Min-Hyuk Oh)",
      field: "Digital electronics, Particle detector, Space weather",
      email: "alsgur0108@khu.ac.kr",
      position: "Master course",
      image: "/researcher3.jpg"
    },
    {
      name: "김성진 (Sung-Jin Kim)",
      field: "Particle detector, Digital electronics, Space weather",
      email: "kimsungjin00@khu.ac.kr",
      position: "Master course",
      image: "/researcher4.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← 홈으로
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                연구실 구성원
              </h1>
              <p className="text-gray-600 mt-2">
                경희대학교 우주과학탑재체연구실 (Space Science Instrument Laboratory)
              </p>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Professor Section */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center border-b pb-4">
            교수
          </h2>
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            <div className="flex-shrink-0">
              <div className="w-48 h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg font-medium">교수님</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{professor.name}</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">연구분야:</span>
                  <span className="ml-2 text-gray-600">{professor.field}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">E-mail:</span>
                  <span className="ml-2 text-blue-600">{professor.email}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Position:</span>
                  <span className="ml-2 text-gray-600">{professor.position}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">학력:</span>
                  <ul className="ml-2 mt-1 space-y-1">
                    {professor.education.map((edu, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {edu}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">주요경력:</span>
                  <ul className="ml-2 mt-1 space-y-1">
                    {professor.career.map((career, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {career}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Researchers Section */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center border-b pb-4 bg-white rounded-lg shadow-md p-6">
            연구진
          </h2>
          {researchers.map((researcher, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-8">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                <div className="flex-shrink-0">
                  <div className={`w-48 h-64 rounded-lg flex items-center justify-center ${
                    researcher.position === "Research Professor" 
                      ? "bg-gradient-to-br from-green-100 to-green-200" 
                      : "bg-gradient-to-br from-purple-100 to-purple-200"
                  }`}>
                    <span className={`text-lg font-medium ${
                      researcher.position === "Research Professor" 
                        ? "text-green-600" 
                        : "text-purple-600"
                    }`}>
                      {researcher.position === "Research Professor" ? "연구교수" : "석사과정"}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{researcher.name}</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-gray-700">연구분야:</span>
                      <span className="ml-2 text-gray-600">{researcher.field}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">E-mail:</span>
                      <span className="ml-2 text-blue-600">{researcher.email}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Position:</span>
                      <span className="ml-2 text-gray-600">{researcher.position}</span>
                    </div>
                    {researcher.phd && (
                      <div>
                        <span className="font-semibold text-gray-700">Ph.D:</span>
                        <span className="ml-2 text-gray-600">{researcher.phd}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-16 bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            경희대학교 우주과학탑재체연구실 (Space Science Instrument Laboratory)
          </h3>
          <p className="text-gray-600 mb-2">
            주소. (우)17104 경기도 용인시 기흥구 덕영대로 1732 경희대학교 국제캠퍼스 천문대
          </p>
          <p className="text-gray-500 text-sm">
            Copyright © ssil.khu.ac.kr All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
