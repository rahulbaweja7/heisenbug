from src.cart import Cart


def test_snapshot_has_discount_cleared():
    cart = Cart()
    cart.add({"name": "widget", "discount_applied": True})

    snapshot = cart.checkout_snapshot()

    assert snapshot[0]["discount_applied"] is False


def test_live_cart_is_not_mutated_by_snapshot():
    cart = Cart()
    cart.add({"name": "widget", "discount_applied": True})

    cart.checkout_snapshot()

    assert cart.items[0]["discount_applied"] is True


def test_snapshot_is_independent_list():
    cart = Cart()
    cart.add({"name": "widget", "discount_applied": True})

    snapshot = cart.checkout_snapshot()
    snapshot.append({"name": "ghost-item", "discount_applied": False})

    assert len(cart.items) == 1
