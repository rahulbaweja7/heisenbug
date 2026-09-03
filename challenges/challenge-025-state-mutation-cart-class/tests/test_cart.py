from src.cart import ShoppingCart


def test_new_cart_starts_empty():
    cart = ShoppingCart()
    assert cart.items == []


def test_second_cart_does_not_see_first_carts_items():
    cart1 = ShoppingCart()
    cart1.add("apple")

    cart2 = ShoppingCart()
    assert cart2.items == []


def test_explicit_items_are_respected():
    cart = ShoppingCart(items=["banana"])
    assert cart.items == ["banana"]


def test_add_still_works():
    cart = ShoppingCart()
    cart.add("apple")
    assert cart.items == ["apple"]
