# Lemon Squeezy 키 발급 & 설정 가이드

"Upgrade to Pro" 기능을 작동시키기 위해 필요한 3가지 키(`API Key`, `Store ID`, `Product ID`)를 얻는 방법입니다.

## 1. Lemon Squeezy 가입 및 스토어 생성
1. [Lemon Squeezy](https://www.lemonsqueezy.com/)에 접속하여 가입합니다.
2. 스토어(Store)를 생성합니다 (이름은 `SoundGravity` 등 자유).
   > **Test Mode**: 개발 중에는 "Test Mode"를 사용하는 것이 좋습니다. 대시보드 상단에서 `Test mode` 토글을 켜주세요.

## 2. 상품(Product) 만들기 (Product ID, Variant ID)
1. 대시보드 왼쪽 메뉴에서 **Products** 클릭.
2. `+` 버튼(Create product) 클릭.
3. 정보 입력:
   - **Name**: `Pro Plan` (원하는 이름)
   - **Pricing model**: `Subscription` (구독)
   - **Price**: 예: `$10` / `Monthly`
4. **Publish** (게시) 버튼을 눌러 상품을 생성합니다.
5. **Product ID (Variant ID) 찾기**:
   - 생성된 상품 목록에서 "Share" 버튼을 클릭합니다.
   - Checkout Link가 나옵니다. 예: `https://store.lemonsqueezy.com/checkout/buy/123456`
   - 맨 뒤의 숫자 **`123456`**이 바로 **`LEMONSQUEEZY_PRODUCT_ID`** 입니다. (Variant ID라고도 함)

## 3. API Key 발급 (API Key)
1. 왼쪽 하단 **Settings** (톱니바퀴) 클릭.
2. 메뉴에서 **API** 클릭.
3. **API Keys** 섹션 옆의 `+` 버튼 클릭.
4. 이름(예: `SoundGravity Dev`)을 입력하고 생성.
5. 화면에 나온 **Key**를 복사합니다. 이것이 **`LEMONSQUEEZY_API_KEY`** 입니다. (한 번만 보여지니 어딘가에 메모하세요!)

## 4. Store ID 찾기 (Store ID)
1. **Settings** -> **Stores** 메뉴 클릭.
2. Store 목록 옆에 있는 **ID** (숫자)를 복사합니다.
3. 이것이 **`LEMONSQUEEZY_STORE_ID`** 입니다.

---

## 5. `.env.local` 파일 설정
복사한 값들을 프로젝트의 `.env.local` 파일에 아래와 같이 붙여넣으세요.

```env
# Lemon Squeezy Keys
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_PRODUCT_ID=your_product_variant_id_here
```

저장 후 서버를 재시작하면 결제 기능이 연동됩니다!
