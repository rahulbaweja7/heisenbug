from src.coupons import Coupon
from src.checkout import is_coupon_valid


def test_unexpired_coupon_is_valid():
    coupon = Coupon("SAVE10", expires_on=100)
    assert is_coupon_valid(coupon, today=50) is True


def test_expired_coupon_is_invalid():
    coupon = Coupon("SAVE10", expires_on=100)
    assert is_coupon_valid(coupon, today=150) is False


def test_expires_today_is_still_valid():
    coupon = Coupon("SAVE10", expires_on=100)
    assert is_coupon_valid(coupon, today=100) is True
