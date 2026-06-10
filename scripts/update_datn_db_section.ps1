$ErrorActionPreference = "Stop"

$docPath = "C:\Users\fptshop\Downloads\DATN_(1)_ok.docx"
$backupPath = "C:\Users\fptshop\Downloads\DATN_(1)_ok_backup_before_36.docx"

if (-not (Test-Path $docPath)) {
    throw "KhĂ´ng tĂ¬m tháº¥y file: $docPath"
}

if (-not (Test-Path $backupPath)) {
    Copy-Item $docPath $backupPath
}

Copy-Item $backupPath $docPath -Force

$word = $null
$doc = $null

function Get-Style([object]$document, [string]$name) {
    return $document.Styles.Item($name)
}

function Add-Paragraph(
    [object]$document,
    [string]$text,
    [string]$styleName = "Content",
    [bool]$bold = $false
) {
    $range = $document.Range($document.Content.End - 1, $document.Content.End - 1)
    $range.Text = $text
    $range.Style = Get-Style $document $styleName
    $range.Font.Name = "Times New Roman"
    $range.Font.Size = 13
    $range.Font.Bold = $(if ($bold) { 1 } else { 0 })
    $range.InsertParagraphAfter()
}

function Add-Table(
    [object]$document,
    [string]$title,
    [object[]]$rows
) {
    Add-Paragraph -document $document -text $title -styleName "Content" -bold $true

    $range = $document.Range($document.Content.End - 1, $document.Content.End - 1)
    $table = $document.Tables.Add($range, $rows.Count + 1, 4)
    $table.Style = "Table Grid"
    $table.Range.Font.Name = "Times New Roman"
    $table.Range.Font.Size = 13
    $table.AllowAutoFit = $true

    $headers = @("TrÆ°á»ng", "Kiá»ƒu dá»¯ liá»‡u", "RĂ ng buá»™c", "Ă nghÄ©a")
    for ($c = 1; $c -le 4; $c++) {
        $cell = $table.Cell(1, $c)
        $cell.Range.Text = $headers[$c - 1]
        $cell.Range.Bold = 1
        $cell.Range.Style = "Content"
    }

    for ($r = 0; $r -lt $rows.Count; $r++) {
        for ($c = 0; $c -lt 4; $c++) {
            $cell = $table.Cell($r + 2, $c + 1)
            $cell.Range.Text = [string]$rows[$r][$c]
            $cell.Range.Bold = 0
            $cell.Range.Style = "Content"
        }
    }

    foreach ($row in $table.Rows) {
        $row.Range.ParagraphFormat.SpaceBefore = 6
        $row.Range.ParagraphFormat.SpaceAfter = 6
    }

    $table.Columns.Item(1).PreferredWidth = 95
    $table.Columns.Item(2).PreferredWidth = 90
    $table.Columns.Item(3).PreferredWidth = 150
    $table.Columns.Item(4).PreferredWidth = 255

    $afterRange = $document.Range($document.Content.End - 1, $document.Content.End - 1)
    $afterRange.InsertParagraphAfter()
}

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $doc = $word.Documents.Open($docPath)

    Add-Paragraph -document $doc -text "3.6.1. Tá»•ng quan mĂ´ hĂ¬nh dá»¯ liá»‡u" -styleName "heading 3"
    Add-Paragraph -document $doc -text "CÆ¡ sá»Ÿ dá»¯ liá»‡u cá»§a há»‡ thá»‘ng Ä‘Æ°á»£c thiáº¿t káº¿ theo mĂ´ hĂ¬nh quan há»‡, bao phá»§ Ä‘áº§y Ä‘á»§ cĂ¡c nhĂ³m nghiá»‡p vá»¥ chĂ­nh gá»“m: quáº£n lĂ½ ngÆ°á»i dĂ¹ng vĂ  xĂ¡c thá»±c, quáº£n lĂ½ danh má»¥c vĂ  sáº£n pháº©m, giá» hĂ ng vĂ  Ä‘Æ¡n hĂ ng, khuyáº¿n mĂ£i - Ä‘Ă¡nh giĂ¡ - hoĂ n tiá»n, cáº¥u hĂ¬nh há»‡ thá»‘ng vĂ  thĂ´ng bĂ¡o quáº£n trá»‹. CĂ¡c báº£ng dá»¯ liá»‡u Ä‘Æ°á»£c liĂªn káº¿t báº±ng khĂ³a ngoáº¡i Ä‘á»ƒ Ä‘áº£m báº£o tĂ­nh nháº¥t quĂ¡n vĂ  há»— trá»£ truy váº¥n theo Ä‘Ăºng luá»“ng nghiá»‡p vá»¥."

    Add-Paragraph -document $doc -text "Báº£ng tá»•ng há»£p cĂ¡c nhĂ³m báº£ng dá»¯ liá»‡u" -styleName "Content" -bold $true
    $summaryRange = $doc.Range($doc.Content.End - 1, $doc.Content.End - 1)
    $summary = $doc.Tables.Add($summaryRange, 6, 3)
    $summary.Style = "Table Grid"
    $summary.Range.Font.Name = "Times New Roman"
    $summary.Range.Font.Size = 13
    $summary.AllowAutoFit = $true
    $summaryHeaders = @("NhĂ³m dá»¯ liá»‡u", "Báº£ng chĂ­nh", "Vai trĂ²")
    for ($c = 1; $c -le 3; $c++) {
        $summary.Cell(1, $c).Range.Text = $summaryHeaders[$c - 1]
        $summary.Cell(1, $c).Range.Bold = 1
        $summary.Cell(1, $c).Range.Style = "Content"
    }
    $summaryRows = @(
        @("NgÆ°á»i dĂ¹ng vĂ  xĂ¡c thá»±c", "users, email_verification_tokens", "Quáº£n lĂ½ tĂ i khoáº£n, Ä‘Äƒng nháº­p, xĂ¡c thá»±c email"),
        @("Danh má»¥c vĂ  sáº£n pháº©m", "categories, subcategories, brands, products, product_images, product_attributes", "Tá»• chá»©c dá»¯ liá»‡u sáº£n pháº©m vĂ  thuá»™c tĂ­nh hiá»ƒn thá»‹"),
        @("Giá» hĂ ng vĂ  Ä‘Æ¡n hĂ ng", "carts, cart_items, orders, order_details", "LÆ°u sáº£n pháº©m dá»± Ä‘á»‹nh mua vĂ  giao dá»‹ch Ä‘áº·t hĂ ng"),
        @("Khuyáº¿n mĂ£i vĂ  chÄƒm sĂ³c sau bĂ¡n", "coupons, promotions, promotion_categories, promotion_brands, promotion_products, product_reviews, refund_requests", "Ăp mĂ£ giáº£m giĂ¡, khuyáº¿n mĂ£i, Ä‘Ă¡nh giĂ¡ vĂ  hoĂ n tiá»n"),
        @("Cáº¥u hĂ¬nh vĂ  thĂ´ng bĂ¡o", "review_settings, shipping_settings, admin_notifications", "LÆ°u cáº¥u hĂ¬nh há»‡ thá»‘ng vĂ  thĂ´ng bĂ¡o ná»™i bá»™")
    )
    for ($r = 0; $r -lt $summaryRows.Count; $r++) {
        for ($c = 0; $c -lt 3; $c++) {
            $summary.Cell($r + 2, $c + 1).Range.Text = $summaryRows[$r][$c]
            $summary.Cell($r + 2, $c + 1).Range.Style = "Content"
        }
    }
    foreach ($row in $summary.Rows) {
        $row.Range.ParagraphFormat.SpaceBefore = 6
        $row.Range.ParagraphFormat.SpaceAfter = 6
    }
    $doc.Range($doc.Content.End - 1, $doc.Content.End - 1).InsertParagraphAfter()

    Add-Paragraph -document $doc -text "3.6.2. NhĂ³m báº£ng ngÆ°á»i dĂ¹ng vĂ  xĂ¡c thá»±c" -styleName "heading 3"
    Add-Table -document $doc -title "Báº£ng users" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh cá»§a ngÆ°á»i dĂ¹ng"),
        @("email", "VARCHAR(150)", "NOT NULL, UNIQUE", "Äá»‹a chá»‰ email Ä‘Äƒng nháº­p"),
        @("password", "VARCHAR(255)", "NOT NULL", "Máº­t kháº©u Ä‘Ă£ mĂ£ hĂ³a"),
        @("provider", "VARCHAR(30)", "NOT NULL", "Nguá»“n Ä‘Äƒng nháº­p: LOCAL, GOOGLE"),
        @("provider_id", "VARCHAR(255)", "UNIQUE", "Äá»‹nh danh tĂ i khoáº£n Google náº¿u cĂ³"),
        @("full_name", "VARCHAR(150)", "NOT NULL", "Há» tĂªn ngÆ°á»i dĂ¹ng"),
        @("phone_number", "VARCHAR(20)", "NULL", "Sá»‘ Ä‘iá»‡n thoáº¡i liĂªn há»‡"),
        @("address", "TEXT", "NULL", "Äá»‹a chá»‰ giao hĂ ng máº·c Ä‘á»‹nh"),
        @("role", "VARCHAR(30)", "NOT NULL", "Vai trĂ²: ADMIN hoáº·c CUSTOMER"),
        @("status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i tĂ i khoáº£n: ACTIVE, INACTIVE, BANNED"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm táº¡o tĂ i khoáº£n"),
        @("updated_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t gáº§n nháº¥t")
    )
    Add-Table -document $doc -title "Báº£ng email_verification_tokens" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh cá»§a báº£ng token"),
        @("token", "VARCHAR", "NOT NULL", "MĂ£ xĂ¡c thá»±c gá»­i qua email"),
        @("user_id", "BIGINT", "FK -> users.id", "TĂ i khoáº£n Ä‘Æ°á»£c xĂ¡c thá»±c"),
        @("expires_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm háº¿t háº¡n cá»§a token"),
        @("used_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm token Ä‘Ă£ Ä‘Æ°á»£c sá»­ dá»¥ng"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm phĂ¡t hĂ nh token")
    )

    Add-Paragraph -document $doc -text "3.6.3. NhĂ³m báº£ng danh má»¥c vĂ  sáº£n pháº©m" -styleName "heading 3"
    Add-Table -document $doc -title "Báº£ng categories" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh cá»§a danh má»¥c"),
        @("name", "VARCHAR(150)", "NOT NULL", "TĂªn danh má»¥c"),
        @("description", "TEXT", "NULL", "MĂ´ táº£ danh má»¥c"),
        @("icon_url", "VARCHAR(500)", "NULL", "áº¢nh/icon Ä‘áº¡i diá»‡n"),
        @("status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i hoáº¡t Ä‘á»™ng cá»§a danh má»¥c"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm táº¡o"),
        @("updated_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t")
    )
    Add-Table -document $doc -title "Báº£ng subcategories" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh cá»§a danh má»¥c con"),
        @("name", "VARCHAR(150)", "NOT NULL", "TĂªn danh má»¥c con"),
        @("description", "TEXT", "NULL", "MĂ´ táº£ chi tiáº¿t"),
        @("icon_url", "VARCHAR(500)", "NULL", "áº¢nh Ä‘áº¡i diá»‡n danh má»¥c con"),
        @("status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i hoáº¡t Ä‘á»™ng"),
        @("category_id", "BIGINT", "FK -> categories.id", "Danh má»¥c cha"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm táº¡o"),
        @("updated_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t")
    )
    Add-Table -document $doc -title "Báº£ng brands" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh cá»§a thÆ°Æ¡ng hiá»‡u"),
        @("name", "VARCHAR(150)", "NOT NULL", "TĂªn thÆ°Æ¡ng hiá»‡u"),
        @("country", "VARCHAR(100)", "NULL", "Quá»‘c gia xuáº¥t xá»©"),
        @("description", "TEXT", "NULL", "MĂ´ táº£ thÆ°Æ¡ng hiá»‡u"),
        @("logo_url", "VARCHAR(500)", "NULL", "ÄÆ°á»ng dáº«n logo"),
        @("status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i hoáº¡t Ä‘á»™ng")
    )
    Add-Table -document $doc -title "Báº£ng products" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh cá»§a sáº£n pháº©m"),
        @("name", "VARCHAR(255)", "NOT NULL", "TĂªn sáº£n pháº©m"),
        @("price", "DECIMAL(12,2)", "NOT NULL", "GiĂ¡ niĂªm yáº¿t"),
        @("stock_quantity", "INT", "NOT NULL", "Sá»‘ lÆ°á»£ng tá»“n kho"),
        @("thumbnail_url", "VARCHAR(500)", "NULL", "áº¢nh Ä‘áº¡i diá»‡n"),
        @("description", "TEXT", "NULL", "MĂ´ táº£ chi tiáº¿t sáº£n pháº©m"),
        @("category_id", "BIGINT", "FK -> categories.id", "Danh má»¥c chĂ­nh"),
        @("subcategory_id", "BIGINT", "FK -> subcategories.id, NULL", "Danh má»¥c con náº¿u cĂ³"),
        @("brand_id", "BIGINT", "FK -> brands.id", "ThÆ°Æ¡ng hiá»‡u sáº£n pháº©m"),
        @("status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i: ACTIVE, INACTIVE, OUT_OF_STOCK"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm táº¡o sáº£n pháº©m"),
        @("updated_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t")
    )
    Add-Table -document $doc -title "Báº£ng product_images" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh áº£nh sáº£n pháº©m"),
        @("product_id", "BIGINT", "FK -> products.id", "Sáº£n pháº©m sá»Ÿ há»¯u áº£nh"),
        @("image_url", "VARCHAR", "NOT NULL", "ÄÆ°á»ng dáº«n áº£nh bá»• sung"),
        @("sort_order", "INT", "NOT NULL", "Thá»© tá»± hiá»ƒn thá»‹ áº£nh")
    )
    Add-Table -document $doc -title "Báº£ng product_attributes" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh thuá»™c tĂ­nh"),
        @("product_id", "BIGINT", "FK -> products.id", "Sáº£n pháº©m sá»Ÿ há»¯u thuá»™c tĂ­nh"),
        @("attribute_name", "VARCHAR", "NOT NULL", "TĂªn thuá»™c tĂ­nh, vĂ­ dá»¥: grade"),
        @("attribute_value", "VARCHAR", "NOT NULL", "GiĂ¡ trá»‹ cá»§a thuá»™c tĂ­nh")
    )

    Add-Paragraph -document $doc -text "3.6.4. NhĂ³m báº£ng giá» hĂ ng vĂ  Ä‘Æ¡n hĂ ng" -styleName "heading 3"
    Add-Table -document $doc -title "Báº£ng carts" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh giá» hĂ ng"),
        @("user_id", "BIGINT", "FK -> users.id, UNIQUE", "Má»—i ngÆ°á»i dĂ¹ng cĂ³ má»™t giá» hĂ ng"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm táº¡o giá» hĂ ng"),
        @("updated_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t giá» hĂ ng")
    )
    Add-Table -document $doc -title "Báº£ng cart_items" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh dĂ²ng giá» hĂ ng"),
        @("cart_id", "BIGINT", "FK -> carts.id", "Giá» hĂ ng chá»©a sáº£n pháº©m"),
        @("product_id", "BIGINT", "FK -> products.id", "Sáº£n pháº©m Ä‘Æ°á»£c thĂªm vĂ o giá»"),
        @("quantity", "INT", "NOT NULL", "Sá»‘ lÆ°á»£ng mua táº¡m thá»i"),
        @("unit_price_snapshot", "DECIMAL(12,2)", "NOT NULL", "ÄÆ¡n giĂ¡ táº¡i thá»i Ä‘iá»ƒm thĂªm vĂ o giá»"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm thĂªm sáº£n pháº©m"),
        @("updated_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t")
    )
    Add-Table -document $doc -title "Báº£ng orders" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh Ä‘Æ¡n hĂ ng"),
        @("user_id", "BIGINT", "FK -> users.id, NULL", "TĂ i khoáº£n Ä‘áº·t hĂ ng"),
        @("guest_name", "VARCHAR(150)", "NOT NULL", "TĂªn ngÆ°á»i nháº­n"),
        @("guest_phone", "VARCHAR(20)", "NOT NULL", "Sá»‘ Ä‘iá»‡n thoáº¡i ngÆ°á»i nháº­n"),
        @("guest_email", "VARCHAR(150)", "NULL", "Email ngÆ°á»i nháº­n"),
        @("shipping_address", "TEXT", "NOT NULL", "Äá»‹a chá»‰ giao hĂ ng Ä‘áº§y Ä‘á»§"),
        @("order_date", "DATETIME", "NOT NULL", "NgĂ y táº¡o Ä‘Æ¡n"),
        @("status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i xá»­ lĂ½ Ä‘Æ¡n hĂ ng"),
        @("payment_method", "VARCHAR(30)", "NOT NULL", "COD hoáº·c BANK_TRANSFER"),
        @("payment_status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i thanh toĂ¡n"),
        @("payment_expired_at", "DATETIME", "NULL", "Háº¡n thanh toĂ¡n online"),
        @("coupon_id", "BIGINT", "FK -> coupons.id, NULL", "MĂ£ giáº£m giĂ¡ Ä‘Æ°á»£c Ă¡p dá»¥ng"),
        @("subtotal_amount", "DECIMAL(12,2)", "NOT NULL", "Tá»•ng tiá»n hĂ ng trÆ°á»›c phĂ­ ship"),
        @("shipping_fee", "DECIMAL(12,2)", "NOT NULL", "PhĂ­ váº­n chuyá»ƒn"),
        @("discount_amount", "DECIMAL(12,2)", "NOT NULL", "Sá»‘ tiá»n Ä‘Æ°á»£c giáº£m"),
        @("total_amount", "DECIMAL(12,2)", "NOT NULL", "Tá»•ng thanh toĂ¡n cuá»‘i cĂ¹ng")
    )
    Add-Table -document $doc -title "Báº£ng order_details" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh chi tiáº¿t Ä‘Æ¡n hĂ ng"),
        @("order_id", "BIGINT", "FK -> orders.id", "ÄÆ¡n hĂ ng cha"),
        @("product_id", "BIGINT", "FK -> products.id", "Sáº£n pháº©m Ä‘Æ°á»£c Ä‘áº·t"),
        @("product_name", "VARCHAR", "NOT NULL", "TĂªn sáº£n pháº©m lÆ°u táº¡i thá»i Ä‘iá»ƒm Ä‘áº·t"),
        @("product_image", "VARCHAR", "NULL", "áº¢nh sáº£n pháº©m lÆ°u kĂ¨m Ä‘Æ¡n"),
        @("quantity", "INT", "NOT NULL", "Sá»‘ lÆ°á»£ng Ä‘áº·t"),
        @("unit_price", "DECIMAL(12,2)", "NOT NULL", "ÄÆ¡n giĂ¡ táº¡i thá»i Ä‘iá»ƒm Ä‘áº·t"),
        @("total_price", "DECIMAL(12,2)", "NOT NULL", "ThĂ nh tiá»n cá»§a dĂ²ng sáº£n pháº©m")
    )

    Add-Paragraph -document $doc -text "3.6.5. NhĂ³m báº£ng khuyáº¿n mĂ£i, Ä‘Ă¡nh giĂ¡ vĂ  hoĂ n tiá»n" -styleName "heading 3"
    Add-Table -document $doc -title "Báº£ng coupons" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh mĂ£ giáº£m giĂ¡"),
        @("code", "VARCHAR(50)", "NOT NULL, UNIQUE", "MĂ£ coupon nháº­p khi Ä‘áº·t hĂ ng"),
        @("discount_type", "VARCHAR(30)", "NOT NULL", "Kiá»ƒu giáº£m: pháº§n trÄƒm hoáº·c sá»‘ tiá»n"),
        @("discount_value", "DECIMAL(12,2)", "NOT NULL", "GiĂ¡ trá»‹ giáº£m"),
        @("min_order_value", "DECIMAL(12,2)", "NULL", "GiĂ¡ trá»‹ Ä‘Æ¡n tá»‘i thiá»ƒu"),
        @("max_discount_amount", "DECIMAL(12,2)", "NULL", "Má»©c giáº£m tá»‘i Ä‘a"),
        @("start_date", "DATETIME", "NOT NULL", "NgĂ y báº¯t Ä‘áº§u hiá»‡u lá»±c"),
        @("end_date", "DATETIME", "NOT NULL", "NgĂ y káº¿t thĂºc hiá»‡u lá»±c"),
        @("usage_limit", "INT", "NULL", "Tá»•ng sá»‘ lÆ°á»£t Ä‘Æ°á»£c phĂ©p sá»­ dá»¥ng"),
        @("used_count", "INT", "NOT NULL", "Sá»‘ lÆ°á»£t Ä‘Ă£ Ä‘Æ°á»£c sá»­ dá»¥ng"),
        @("status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i coupon")
    )
    Add-Table -document $doc -title "Báº£ng promotions" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh chÆ°Æ¡ng trĂ¬nh khuyáº¿n mĂ£i"),
        @("name", "VARCHAR(150)", "NOT NULL", "TĂªn chÆ°Æ¡ng trĂ¬nh"),
        @("description", "TEXT", "NULL", "MĂ´ táº£ khuyáº¿n mĂ£i"),
        @("discount_type", "VARCHAR(30)", "NOT NULL", "Kiá»ƒu giáº£m giĂ¡"),
        @("discount_value", "DECIMAL(12,2)", "NOT NULL", "GiĂ¡ trá»‹ khuyáº¿n mĂ£i"),
        @("start_date", "DATETIME", "NOT NULL", "NgĂ y báº¯t Ä‘áº§u"),
        @("end_date", "DATETIME", "NOT NULL", "NgĂ y káº¿t thĂºc"),
        @("status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i hoáº¡t Ä‘á»™ng"),
        @("priority", "INT", "NOT NULL", "Má»©c Æ°u tiĂªn khi Ă¡p nhiá»u khuyáº¿n mĂ£i"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm táº¡o"),
        @("updated_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t")
    )
    Add-Table -document $doc -title "Báº£ng promotion_categories" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh liĂªn káº¿t"),
        @("promotion_id", "BIGINT", "FK -> promotions.id", "ChÆ°Æ¡ng trĂ¬nh khuyáº¿n mĂ£i"),
        @("category_id", "BIGINT", "FK -> categories.id", "Danh má»¥c Ä‘Æ°á»£c Ă¡p dá»¥ng")
    )
    Add-Table -document $doc -title "Báº£ng promotion_brands" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh liĂªn káº¿t"),
        @("promotion_id", "BIGINT", "FK -> promotions.id", "ChÆ°Æ¡ng trĂ¬nh khuyáº¿n mĂ£i"),
        @("brand_id", "BIGINT", "FK -> brands.id", "ThÆ°Æ¡ng hiá»‡u Ä‘Æ°á»£c Ă¡p dá»¥ng")
    )
    Add-Table -document $doc -title "Báº£ng promotion_products" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh liĂªn káº¿t"),
        @("promotion_id", "BIGINT", "FK -> promotions.id", "ChÆ°Æ¡ng trĂ¬nh khuyáº¿n mĂ£i"),
        @("product_id", "BIGINT", "FK -> products.id", "Sáº£n pháº©m Ä‘Æ°á»£c Ă¡p dá»¥ng"),
        @("sale_stock_limit", "INT", "NULL", "Sá»‘ lÆ°á»£ng tá»‘i Ä‘a Ä‘Æ°á»£c bĂ¡n theo giĂ¡ khuyáº¿n mĂ£i"),
        @("sold_count", "INT", "NOT NULL", "Sá»‘ lÆ°á»£ng Ä‘Ă£ bĂ¡n theo chÆ°Æ¡ng trĂ¬nh")
    )
    Add-Table -document $doc -title "Báº£ng product_reviews" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh Ä‘Ă¡nh giĂ¡"),
        @("product_id", "BIGINT", "FK -> products.id", "Sáº£n pháº©m Ä‘Æ°á»£c Ä‘Ă¡nh giĂ¡"),
        @("user_id", "BIGINT", "FK -> users.id, UNIQUE theo cáº·p", "NgÆ°á»i Ä‘Ă¡nh giĂ¡; má»—i user chá»‰ Ä‘Ă¡nh giĂ¡ 1 láº§n / sáº£n pháº©m"),
        @("rating", "INT", "NOT NULL", "Sá»‘ sao Ä‘Ă¡nh giĂ¡"),
        @("content", "TEXT", "NOT NULL", "Ná»™i dung Ä‘Ă¡nh giĂ¡"),
        @("admin_reply", "TEXT", "NULL", "Pháº£n há»“i tá»« quáº£n trá»‹ viĂªn"),
        @("replied_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm tráº£ lá»i Ä‘Ă¡nh giĂ¡"),
        @("status", "VARCHAR(30)", "NOT NULL", "PENDING, APPROVED, REJECTED"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm táº¡o Ä‘Ă¡nh giĂ¡"),
        @("updated_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t")
    )
    Add-Table -document $doc -title "Báº£ng refund_requests" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh yĂªu cáº§u hoĂ n tiá»n"),
        @("order_id", "BIGINT", "FK -> orders.id", "ÄÆ¡n hĂ ng liĂªn quan"),
        @("user_id", "BIGINT", "FK -> users.id", "NgÆ°á»i gá»­i yĂªu cáº§u"),
        @("reason", "TEXT", "NOT NULL", "LĂ½ do yĂªu cáº§u hoĂ n tiá»n"),
        @("status", "VARCHAR(30)", "NOT NULL", "Tráº¡ng thĂ¡i xá»­ lĂ½ hoĂ n tiá»n"),
        @("refund_amount", "DECIMAL(12,2)", "NOT NULL", "Sá»‘ tiá»n Ä‘Æ°á»£c hoĂ n"),
        @("admin_note", "TEXT", "NULL", "Ghi chĂº xá»­ lĂ½ tá»« quáº£n trá»‹ viĂªn"),
        @("processed_by", "BIGINT", "FK -> users.id, NULL", "Quáº£n trá»‹ viĂªn xá»­ lĂ½"),
        @("processed_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm xá»­ lĂ½"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm táº¡o yĂªu cáº§u"),
        @("updated_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t")
    )

    Add-Paragraph -document $doc -text "3.6.6. NhĂ³m báº£ng cáº¥u hĂ¬nh vĂ  thĂ´ng bĂ¡o" -styleName "heading 3"
    Add-Table -document $doc -title "Báº£ng review_settings" -rows @(
        @("id", "BIGINT", "PK", "Báº£n ghi cáº¥u hĂ¬nh duy nháº¥t"),
        @("review_approval_enabled", "BOOLEAN", "NOT NULL", "Báº­t/táº¯t cháº¿ Ä‘á»™ duyá»‡t Ä‘Ă¡nh giĂ¡"),
        @("updated_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t cáº¥u hĂ¬nh")
    )
    Add-Table -document $doc -title "Báº£ng shipping_settings" -rows @(
        @("id", "BIGINT", "PK", "Báº£n ghi cáº¥u hĂ¬nh duy nháº¥t"),
        @("north_fee", "DECIMAL(12,2)", "NOT NULL", "PhĂ­ ship khu vá»±c miá»n Báº¯c"),
        @("central_fee", "DECIMAL(12,2)", "NOT NULL", "PhĂ­ ship khu vá»±c miá»n Trung"),
        @("south_fee", "DECIMAL(12,2)", "NOT NULL", "PhĂ­ ship khu vá»±c miá»n Nam"),
        @("free_shipping_threshold", "DECIMAL(12,2)", "NOT NULL", "NgÆ°á»¡ng miá»…n phĂ­ váº­n chuyá»ƒn"),
        @("updated_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm cáº­p nháº­t cáº¥u hĂ¬nh")
    )
    Add-Table -document $doc -title "Báº£ng admin_notifications" -rows @(
        @("id", "BIGINT", "PK, auto increment", "KhĂ³a chĂ­nh thĂ´ng bĂ¡o"),
        @("type", "VARCHAR(30)", "NOT NULL", "Loáº¡i thĂ´ng bĂ¡o, vĂ­ dá»¥ NEW_ORDER"),
        @("title", "VARCHAR(200)", "NOT NULL", "TiĂªu Ä‘á» thĂ´ng bĂ¡o"),
        @("message", "TEXT", "NOT NULL", "Ná»™i dung thĂ´ng bĂ¡o"),
        @("order_id", "BIGINT", "FK -> orders.id, NULL", "ÄÆ¡n hĂ ng liĂªn quan náº¿u cĂ³"),
        @("created_at", "DATETIME", "NOT NULL", "Thá»i Ä‘iá»ƒm táº¡o thĂ´ng bĂ¡o"),
        @("read_at", "DATETIME", "NULL", "Thá»i Ä‘iá»ƒm quáº£n trá»‹ viĂªn Ä‘Ă£ xem")
    )

    $doc.Save()
    $doc.Close()
    $word.Quit()

    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()

    Write-Output "UPDATED: $docPath"
    Write-Output "BACKUP: $backupPath"
} catch {
    if ($doc -ne $null) {
        try { $doc.Close([ref]0) } catch {}
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
    }
    if ($word -ne $null) {
        try { $word.Quit() } catch {}
        [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
    throw
}
