# PDF Analysis Troubleshooting Guide

## Current Implementation

The PDF analysis has been improved to:
1. **Use OCR text as primary source** - For PDFs with good OCR (confidence > 0.7, text > 100 chars), the system uses ONLY the extracted text instead of trying to send the PDF file
2. **Better OCR extraction** - Handles multiple response formats from NanoBanana Pro
3. **Improved logging** - Better debugging information

## Why PDFs Might Not Work

### 1. Supabase Function Not Deployed
**Issue**: The updated function code is in GitHub but not deployed to Supabase.

**Solution**: Deploy the function:
```bash
# Using Supabase CLI
supabase functions deploy process-document

# Or deploy via Supabase Dashboard:
# 1. Go to your Supabase project
# 2. Navigate to Edge Functions
# 3. Deploy the process-document function
```

### 2. NanoBanana Pro Not Configured
**Issue**: OCR extraction fails because API key is missing.

**Check**: 
- Verify `NANOBANANA_API_KEY` is set in Supabase Edge Function secrets
- Verify `NANOBANANA_API_URL` is correct (default: `https://api.nanobanana.pro/v1/process`)

**Solution**: 
1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add `NANOBANANA_API_KEY` with your API key
3. Optionally add `NANOBANANA_API_URL` if using a custom endpoint

### 3. PDF Format Issues
**Issue**: Some PDFs might be:
- Password protected
- Corrupted
- Scanned images (not text-based)
- Very large files

**Solution**: 
- Check browser console for error messages
- Try with a simple, text-based PDF first
- Check file size (very large PDFs might timeout)

### 4. OCR Extraction Failing
**Issue**: NanoBanana Pro API might be:
- Returning errors
- Not extracting text properly
- Timing out

**Debug**: Check Supabase function logs:
1. Go to Supabase Dashboard → Edge Functions → process-document → Logs
2. Look for messages like:
   - "NanoBanana Pro extracted X characters"
   - "NanoBanana Pro API error"
   - "OCR preview"

## How to Test

1. **Check OCR is working**:
   - Upload a PDF
   - Check browser console for: "✓ NanoBanana Pro extracted X characters"
   - If you see "⚠" or no OCR message, OCR is not working

2. **Check function is deployed**:
   - Upload a PDF
   - Check Supabase function logs
   - Should see processing messages

3. **Test with different PDFs**:
   - Try a simple invoice PDF
   - Try a bank statement PDF
   - Try a receipt PDF

## Expected Behavior

### With Good OCR (confidence > 0.7, text > 100 chars):
- System uses ONLY the OCR text
- No PDF file sent to Gemini
- Faster processing
- More accurate extraction

### Without Good OCR:
- System tries to analyze PDF directly
- May be less accurate
- Depends on Gemini's PDF handling

## Debugging Steps

1. **Check Supabase Function Logs**:
   ```
   Supabase Dashboard → Edge Functions → process-document → Logs
   ```
   Look for:
   - OCR extraction messages
   - Error messages
   - Processing details

2. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for errors or warnings
   - Check network tab for API calls

3. **Test OCR Directly**:
   - Check if NanoBanana Pro API is accessible
   - Verify API key is valid
   - Test with a simple PDF

## Quick Fixes

### If OCR is not working:
1. Verify NanoBanana Pro API key is set
2. Check API URL is correct
3. Verify you have API credits/quota
4. Check API response format matches expected format

### If function is not deployed:
1. Deploy via Supabase CLI or Dashboard
2. Verify deployment succeeded
3. Check function is active

### If PDFs still fail:
1. Check file type is `application/pdf`
2. Verify file is not corrupted
3. Try with a different PDF
4. Check file size (should be reasonable)

## Contact

If issues persist:
1. Check Supabase function logs for detailed error messages
2. Check browser console for client-side errors
3. Verify all environment variables are set correctly
4. Test with a known-good PDF to isolate the issue

